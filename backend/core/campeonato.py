# backend/core/campeonato.py
from __future__ import annotations
from typing import List, Dict, Any, Tuple
import json
import random

from core.db_sqlite import get_conn
from core.competicoes_engine import (
    criar_calendario_turno_returno,
    gerar_chaveamento,
    simular_jogo_simples,
    decidir_penaltis,
)
from core.seeds.seed_br_2025 import (
    SERIE_C_2025_PROMOVIDOS,
    SERIE_C_2025_REBAIXADOS,
    SERIE_D_2025_PROMOVIDOS,
)

TEMPORADA_INICIAL = 2026


# ============================================================
# DB INIT
# ============================================================
def init_db():
    with get_conn() as conn:
        cur = conn.cursor()

        cur.execute("""
        CREATE TABLE IF NOT EXISTS carreiras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            liga TEXT NOT NULL,
            meu_time TEXT NOT NULL,
            rodada_atual INTEGER NOT NULL DEFAULT 0,
            temporada INTEGER NOT NULL DEFAULT 2026,
            criada_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS clubes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carreira_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            pontos INTEGER NOT NULL DEFAULT 0,
            jogos INTEGER NOT NULL DEFAULT 0,
            vitorias INTEGER NOT NULL DEFAULT 0,
            empates INTEGER NOT NULL DEFAULT 0,
            derrotas INTEGER NOT NULL DEFAULT 0,
            gp INTEGER NOT NULL DEFAULT 0,
            gc INTEGER NOT NULL DEFAULT 0,
            saldo INTEGER NOT NULL DEFAULT 0,
            serie TEXT NOT NULL DEFAULT 'A',
            UNIQUE(carreira_id, nome)
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS partidas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carreira_id INTEGER NOT NULL,
            competicao TEXT NOT NULL,
            rodada INTEGER,
            fase TEXT,
            perna INTEGER DEFAULT 1,
            mandante TEXT NOT NULL,
            visitante TEXT NOT NULL,
            gols_mandante INTEGER,
            gols_visitante INTEGER,
            penaltis_vencedor TEXT,
            jogada_em TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute("""
        CREATE TABLE IF NOT EXISTS artilharia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carreira_id INTEGER NOT NULL,
            jogador TEXT NOT NULL,
            clube TEXT NOT NULL,
            gols INTEGER NOT NULL DEFAULT 0,
            UNIQUE(carreira_id, jogador, clube)
        )
        """)

        # guarda estado do calendário da rodada/copa
        cur.execute("""
        CREATE TABLE IF NOT EXISTS contextos (
            carreira_id INTEGER PRIMARY KEY,
            contexto_json TEXT NOT NULL
        )
        """)


# ============================================================
# HELPERS
# ============================================================
def _upsert_artilheiro(carreira_id: int, jogador: str, clube: str, gols: int = 1):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO artilharia (carreira_id, jogador, clube, gols)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(carreira_id, jogador, clube)
            DO UPDATE SET gols = gols + ?
        """, (carreira_id, jogador, clube, gols, gols))


def listar_artilheiros(carreira_id: int, limit: int = 30) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT jogador as nome, clube, gols
            FROM artilharia
            WHERE carreira_id=?
            ORDER BY gols DESC, nome ASC
            LIMIT ?
        """, (carreira_id, limit))
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def _reset_tabela_clubes(carreira_id: int, times: List[str], serie: str):
    with get_conn() as conn:
        cur = conn.cursor()
        for t in times:
            cur.execute("""
                INSERT OR IGNORE INTO clubes
                (carreira_id, nome, pontos, jogos, vitorias, empates, derrotas, gp, gc, saldo, serie)
                VALUES (?, ?, 0,0,0,0,0,0,0,0, ?)
            """, (carreira_id, t, serie))


def gerar_tabela(carreira_id: int, serie: str | None = None) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        cur = conn.cursor()

        if serie:
            cur.execute("""
                SELECT nome, pontos, jogos, vitorias, empates, derrotas, gp, gc, saldo, serie
                FROM clubes
                WHERE carreira_id=? AND serie=?
                ORDER BY pontos DESC, saldo DESC, gp DESC, nome ASC
            """, (carreira_id, serie))
        else:
            cur.execute("""
                SELECT nome, pontos, jogos, vitorias, empates, derrotas, gp, gc, saldo, serie
                FROM clubes
                WHERE carreira_id=?
                ORDER BY serie ASC, pontos DESC, saldo DESC, gp DESC, nome ASC
            """, (carreira_id,))

        rows = cur.fetchall()
        return [dict(r) for r in rows]


def atualizar_classificacao(carreira_id: int, mandante: str, visitante: str, gm: int, gv: int):
    def up(nome, pontos, v, e, d, gp, gc):
        saldo = gp - gc
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                UPDATE clubes
                SET pontos = pontos + ?,
                    jogos = jogos + 1,
                    vitorias = vitorias + ?,
                    empates = empates + ?,
                    derrotas = derrotas + ?,
                    gp = gp + ?,
                    gc = gc + ?,
                    saldo = saldo + ?
                WHERE carreira_id=? AND nome=?
            """, (pontos, v, e, d, gp, gc, saldo, carreira_id, nome))

    if gm > gv:
        up(mandante, 3, 1, 0, 0, gm, gv)
        up(visitante, 0, 0, 0, 1, gv, gm)
    elif gm < gv:
        up(mandante, 0, 0, 0, 1, gm, gv)
        up(visitante, 3, 1, 0, 0, gv, gm)
    else:
        up(mandante, 1, 0, 1, 0, gm, gv)
        up(visitante, 1, 0, 1, 0, gv, gm)


def carregar_carreira(carreira_id: int) -> Dict[str, Any]:
    init_db()
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM carreiras WHERE id=?", (carreira_id,))
        row = cur.fetchone()
        if not row:
            raise ValueError("Carreira não encontrada")
        return dict(row)


def _save_context(carreira_id: int, ctx: Dict[str, Any]):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO contextos (carreira_id, contexto_json)
            VALUES (?, ?)
            ON CONFLICT(carreira_id) DO UPDATE SET contexto_json=excluded.contexto_json
        """, (carreira_id, json.dumps(ctx, ensure_ascii=False)))


def _load_context(carreira_id: int) -> Dict[str, Any]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT contexto_json FROM contextos WHERE carreira_id=?", (carreira_id,))
        row = cur.fetchone()
        if not row:
            return {}
        return json.loads(row["contexto_json"])


# ============================================================
# SETUP TEMPORADA 2026 REAL (Brasil)
# ============================================================
def setup_temporada_2026_real(carreira_id: int, times_da_liga: List[str]):
    """
    Usa seed 2025 para:
    - compor Série C 2026 (remove promovidos + remove rebaixados + adiciona promovidos da D)
    - manter compatibilidade com o banco atual do usuário (se tiver só 20 times, beleza)
    - criar Copa do Brasil 64 clubes a partir dos clubes existentes
    """

    # ✅ Série A = os 20 times da liga (ex: Campeonato Brasileiro no seu banco)
    serie_a = times_da_liga[:]

    # ✅ Série C 2026: se os clubes existirem na sua liga, aplica regras.
    # (Se não existirem, não quebra: só não muda nada)
    serie_c_base = []
    for t in serie_a:
        # (no início, você pode ter apenas Série A no arquivo "database")
        # então vamos construir Série C como "todos - promovidos - rebaixados + promovidos D" quando existir.
        serie_c_base.append(t)

    serie_c = [t for t in serie_c_base if t not in SERIE_C_2025_PROMOVIDOS and t not in SERIE_C_2025_REBAIXADOS]
    for t in SERIE_D_2025_PROMOVIDOS:
        if t not in serie_c:
            serie_c.append(t)

    # Garantir 20 (Série C tem 20)
    serie_c = serie_c[:20]

    # ✅ Série B (placeholder realista):
    # No seu database atual você ainda não tem Série B/C completa, então:
    # A gente cria Série B como:
    #  - Série A sem os 4 piores (pra ter 16)
    #  - + 4 promovidos da Série C 2025 (para dar efeito real)
    serie_b = [t for t in serie_a if t not in serie_a[-4:]]
    for t in SERIE_C_2025_PROMOVIDOS:
        if t not in serie_b:
            serie_b.append(t)
    serie_b = serie_b[:20]

    _reset_tabela_clubes(carreira_id, serie_a, "A")
    _reset_tabela_clubes(carreira_id, serie_b, "B")
    _reset_tabela_clubes(carreira_id, serie_c, "C")

    # ✅ Salvar calendário da Série A (turno/returno)
    calendario_a = criar_calendario_turno_returno(serie_a)

    # ✅ Copa do Brasil 64 clubes:
    #  - começa com 64 dos clubes disponíveis em A/B/C
    pool = list(dict.fromkeys(serie_a + serie_b + serie_c))
    random.shuffle(pool)
    copa64 = pool[:64] if len(pool) >= 64 else pool

    ctx = {
        "serie_a": {
            "rodada_atual": 0,
            "calendario": calendario_a,
        },
        "copa_do_brasil": {
            "fase": "1F",
            "participantes": copa64,
            "chave": gerar_chaveamento(copa64),
            "proximos": [],
            "ida_volta": False,
            "jogos_pendentes": []
        }
    }

    _save_context(carreira_id, ctx)


# ============================================================
# CARREIRA / TEMPORADA
# ============================================================
def criar_carreira(liga: str, meu_time: str, times: List[str]) -> Dict[str, Any]:
    init_db()

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO carreiras (liga, meu_time, rodada_atual, temporada)
            VALUES (?, ?, 0, ?)
        """, (liga, meu_time, TEMPORADA_INICIAL))
        carreira_id = cur.lastrowid

    setup_temporada_2026_real(carreira_id, times)

    return {
        "carreira_id": carreira_id,
        "liga": liga,
        "meu_time": meu_time,
        "temporada": TEMPORADA_INICIAL
    }


# ============================================================
# RODADAS (SÉRIE A)
# ============================================================
def iniciar_rodada(carreira_id: int, times: List[str]) -> Dict[str, Any]:
    carreira = carregar_carreira(carreira_id)
    meu_time = carreira["meu_time"]

    ctx = _load_context(carreira_id)
    serie_a_ctx = ctx.get("serie_a", {})
    calendario = serie_a_ctx.get("calendario") or criar_calendario_turno_returno(times[:])

    rodada_idx = serie_a_ctx.get("rodada_atual", 0)
    if rodada_idx >= len(calendario):
        return {"finalizado": True, "msg": "Brasileirão finalizado"}

    rodada = calendario[rodada_idx]

    jogo_usuario = None
    outros_jogos = []

    for mandante, visitante in rodada:
        if mandante == meu_time or visitante == meu_time:
            jogo_usuario = {"mandante": mandante, "visitante": visitante}
        else:
            outros_jogos.append({"mandante": mandante, "visitante": visitante})

    ctx["rodada_em_aberto"] = {
        "competicao": "SERIE_A",
        "rodada": rodada_idx + 1,
        "jogo_usuario": jogo_usuario,
        "outros_jogos": outros_jogos
    }
    _save_context(carreira_id, ctx)

    return {
        "finalizado": False,
        "rodada": rodada_idx + 1,
        "jogo_usuario": jogo_usuario,
        "outros_jogos": outros_jogos
    }


def finalizar_rodada(
    carreira_id: int,
    liga: str,
    rodada: int,
    jogo_usuario: Dict[str, str],
    placar_usuario: Dict[str, int],
    eventos_usuario: List[Dict[str, Any]],
    escalacoes_usuario: Dict[str, Any]
) -> Dict[str, Any]:
    ctx = _load_context(carreira_id)
    rodada_ctx = ctx.get("rodada_em_aberto")
    if not rodada_ctx:
        raise ValueError("Nenhuma rodada em aberto. Clique em iniciar rodada primeiro.")

    # 1) Salvar jogo do usuário
    gm = int(placar_usuario.get("mandante", 0))
    gv = int(placar_usuario.get("visitante", 0))

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO partidas (carreira_id, competicao, rodada, mandante, visitante, gols_mandante, gols_visitante)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (carreira_id, "SERIE_A", rodada, jogo_usuario["mandante"], jogo_usuario["visitante"], gm, gv))

    atualizar_classificacao(carreira_id, jogo_usuario["mandante"], jogo_usuario["visitante"], gm, gv)

    # artilharia a partir dos eventos_usuario se tiver "tipo"=="GOL" e "jogador"
    for ev in eventos_usuario or []:
        if ev.get("tipo") == "GOL":
            jogador = ev.get("jogador") or "Desconhecido"
            clube = ev.get("time") or "—"
            _upsert_artilheiro(carreira_id, jogador, clube, 1)

    # 2) Simular outros jogos
    resultados_outros = []
    for j in rodada_ctx.get("outros_jogos", []):
        x, y = simular_jogo_simples()

        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO partidas (carreira_id, competicao, rodada, mandante, visitante, gols_mandante, gols_visitante)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (carreira_id, "SERIE_A", rodada, j["mandante"], j["visitante"], x, y))

        atualizar_classificacao(carreira_id, j["mandante"], j["visitante"], x, y)

        resultados_outros.append({
            "mandante": j["mandante"], "visitante": j["visitante"],
            "gols_mandante": x, "gols_visitante": y
        })

    # 3) avançar rodada
    serie_a_ctx = ctx.get("serie_a", {})
    serie_a_ctx["rodada_atual"] = int(serie_a_ctx.get("rodada_atual", 0)) + 1
    ctx["serie_a"] = serie_a_ctx
    ctx.pop("rodada_em_aberto", None)
    _save_context(carreira_id, ctx)

    # atualizar tabela no retorno
    tabela_a = gerar_tabela(carreira_id, "A")

    return {
        "ok": True,
        "rodada": rodada,
        "jogo_usuario": {"mandante": jogo_usuario["mandante"], "visitante": jogo_usuario["visitante"], "gols_mandante": gm, "gols_visitante": gv},
        "outros_resultados": resultados_outros,
        "classificacao": tabela_a,
        "artilheiros": listar_artilheiros(carreira_id, limit=20)
    }


# ============================================================
# COPA DO BRASIL (64)
# ============================================================
def _salvar_partida_copa(carreira_id: int, fase: str, perna: int, mandante: str, visitante: str, gm: int, gv: int, pen_vencedor: str | None):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO partidas (carreira_id, competicao, fase, perna, mandante, visitante, gols_mandante, gols_visitante, penaltis_vencedor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (carreira_id, "COPA_BR", fase, perna, mandante, visitante, gm, gv, pen_vencedor))


def jogar_copa_do_brasil_proxima_fase(carreira_id: int) -> Dict[str, Any]:
    """
    Executa TODA a fase da Copa (simulada por enquanto).
    No futuro você pode "injetar" o jogo do usuário aqui.
    """
    ctx = _load_context(carreira_id)
    copa = ctx.get("copa_do_brasil")
    if not copa:
        raise ValueError("Copa do Brasil não encontrada no contexto.")

    fase = copa.get("fase", "1F")
    chave = copa.get("chave", [])

    # fase -> define se é jogo único ou ida/volta
    mapa = {"1F": 1, "2F": 2, "OIT": 3, "QF": 4, "SF": 5, "F": 6}
    fase_n = mapa.get(fase, 1)
    ida_volta = fase_n >= 3  # oitavas+

    vencedores = []

    for mandante, visitante in chave:
        if not ida_volta:
            gm, gv = simular_jogo_simples()
            pen = None

            if gm == gv:
                pen = decidir_penaltis()
                vencedor = mandante if pen == "MANDANTE" else visitante
            else:
                vencedor = mandante if gm > gv else visitante

            _salvar_partida_copa(carreira_id, fase, 1, mandante, visitante, gm, gv, pen)
            vencedores.append(vencedor)

        else:
            # ida
            gm1, gv1 = simular_jogo_simples()
            _salvar_partida_copa(carreira_id, fase, 1, mandante, visitante, gm1, gv1, None)

            # volta (mando invertido)
            gm2, gv2 = simular_jogo_simples()
            _salvar_partida_copa(carreira_id, fase, 2, visitante, mandante, gm2, gv2, None)

            # agregado
            agregado_m = gm1 + gv2
            agregado_v = gv1 + gm2

            if agregado_m == agregado_v:
                pen = decidir_penaltis()
                vencedor = mandante if pen == "MANDANTE" else visitante
                # registramos pênaltis na volta
                _salvar_partida_copa(carreira_id, fase, 2, visitante, mandante, gm2, gv2, pen)
            else:
                vencedor = mandante if agregado_m > agregado_v else visitante

            vencedores.append(vencedor)

    # avançar fase
    prox = None
    if fase == "1F":
        prox = "2F"
    elif fase == "2F":
        prox = "OIT"
    elif fase == "OIT":
        prox = "QF"
    elif fase == "QF":
        prox = "SF"
    elif fase == "SF":
        prox = "F"
    elif fase == "F":
        prox = "FIM"

    if prox == "FIM":
        copa["fase"] = "FIM"
        copa["campeao"] = vencedores[0] if vencedores else None
        ctx["copa_do_brasil"] = copa
        _save_context(carreira_id, ctx)
        return {"finalizado": True, "campeao": copa.get("campeao")}

    copa["fase"] = prox
    copa["participantes"] = vencedores
    copa["chave"] = gerar_chaveamento(vencedores)

    ctx["copa_do_brasil"] = copa
    _save_context(carreira_id, ctx)

    return {
        "finalizado": False,
        "fase": prox,
        "confrontos": copa["chave"]
    }
