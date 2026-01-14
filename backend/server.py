from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
import sqlite3

# ===================== IMPORTS CORE =====================
from core.db_sqlite import get_conn, init_db as init_db_temporadas
from core.database import carregar_sistema_completo

from core.campeonato import (
    init_db as init_db_campeonato,
    criar_carreira,
    carregar_carreira,
    gerar_tabela,
    listar_artilheiros,
    iniciar_rodada,
    finalizar_rodada,
    jogar_copa_do_brasil_proxima_fase,
)

# ===================== CACHE EM MEMÓRIA =====================
LIGAS_CACHE = []


# ==========================================================
# DB HELPERS (TEMPORADAS)
# ==========================================================
def listar_ligas_db() -> List[str]:
    """
    Lê ligas do banco (tabela temporadas).
    Se ainda não existir ou estiver vazia, retorna [].
    """
    try:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT DISTINCT liga
                FROM temporadas
                ORDER BY liga ASC
            """)
            rows = cur.fetchall()
            return [r["liga"] for r in rows]
    except sqlite3.OperationalError:
        # tabela pode não existir se init_db não rodou
        return []
    except Exception:
        return []


def listar_times_db(liga: str) -> List[Dict[str, Any]]:
    """
    Retorna times da temporada mais recente da liga salva no banco.
    """
    try:
        with get_conn() as conn:
            cur = conn.cursor()

            # pega temporada mais recente
            cur.execute("""
                SELECT id
                FROM temporadas
                WHERE liga=?
                ORDER BY id DESC
                LIMIT 1
            """, (liga,))
            temp = cur.fetchone()
            if not temp:
                return []

            temporada_id = temp["id"]

            cur.execute("""
                SELECT time_nome as nome, logo, cor
                FROM temporada_times
                WHERE temporada_id=?
                ORDER BY time_nome ASC
            """, (temporada_id,))
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception:
        return []


# ==========================================================
# HELPERS (JSON / CACHE)
# ==========================================================
def carregar_ligas_para_cache():
    """
    Carrega do JSON (times_br.json) e deixa em memória.
    """
    global LIGAS_CACHE
    try:
        LIGAS_CACHE = carregar_sistema_completo()
        print(f"✅ LIGAS CACHE: {len(LIGAS_CACHE)} ligas carregadas do JSON")
    except Exception as e:
        LIGAS_CACHE = []
        print("⚠️ Não foi possível carregar times_br.json:", e)


def achar_liga_cache(nome: str):
    return next((l for l in LIGAS_CACHE if l.nome == nome), None)


def achar_time_cache(liga_nome: str, time_nome: str):
    liga = achar_liga_cache(liga_nome)
    if not liga:
        return None, None
    time = next((t for t in liga.times if t.nome == time_nome), None)
    return liga, time


def serializar_jogador(j):
    return {
        "nome": getattr(j, "nome", "—"),
        "posicao": getattr(j, "posicao", "—"),
        "forca": getattr(j, "forca", 70),
        "nacionalidade": getattr(j, "nacionalidade", "—"),
        "lesao": getattr(j, "lesao", False),
        "idade": getattr(j, "idade", None),
        "altura": getattr(j, "altura", None),
        "pe": getattr(j, "pe", None),
        "atributos": getattr(j, "atributos", None),
    }


def serializar_time(time_obj):
    return {
        "nome": time_obj.nome,
        "cor": time_obj.cor,
        "logo": time_obj.logo,
        "uniforme_home": getattr(time_obj, "uniforme_home", None),
        "uniforme_away": getattr(time_obj, "uniforme_away", None),
        "tecnico": {"nome": time_obj.tecnico.nome if time_obj.tecnico else "—"},
        "elenco": [serializar_jogador(j) for j in getattr(time_obj, "elenco", [])],
    }


# ==========================================================
# LIFESPAN (SUBSTITUI STARTUP DEPRECATED)
# ==========================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 🔥 garante DB pronto
    init_db_temporadas()
    init_db_campeonato()

    # 🔥 carrega JSON em cache
    carregar_ligas_para_cache()

    print("✅ API pronta.")
    yield
    print("🛑 API finalizada.")


# ==========================================================
# APP
# ==========================================================
app = FastAPI(title="Playlife API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== MODELS =====================
class CriarCarreiraBody(BaseModel):
    liga: str
    meu_time: str


class FinalizarRodadaBody(BaseModel):
    liga: str
    rodada: int
    jogo_usuario: Dict[str, str]
    placar_usuario: Dict[str, int]
    eventos_usuario: List[Dict[str, Any]] = []
    escalacoes_usuario: Dict[str, Any] = {}


# ==========================================================
# ROTAS
# ==========================================================
@app.get("/")
def home():
    return {"status": "Servidor rodando com sucesso", "api": "Playlife"}


@app.get("/ligas")
def listar_ligas():
    """
    Estratégia:
    1) tenta DB (temporadas)
    2) fallback para JSON carregado em cache
    """
    ligas_db = listar_ligas_db()
    if ligas_db:
        return ligas_db

    # fallback JSON
    if not LIGAS_CACHE:
        raise HTTPException(status_code=500, detail="Nenhuma liga carregada (JSON vazio/ausente).")

    return [l.nome for l in LIGAS_CACHE]


@app.get("/times/{liga_nome}")
def listar_times(liga_nome: str):
    """
    1) tenta DB (temporada_times da temporada mais recente)
    2) fallback JSON
    """
    times_db = listar_times_db(liga_nome)
    if times_db:
        return times_db

    liga = achar_liga_cache(liga_nome)
    if not liga:
        raise HTTPException(status_code=404, detail="Liga não encontrada")

    return [{"nome": t.nome, "cor": t.cor, "logo": t.logo} for t in liga.times]


@app.get("/time/{liga_nome}/{time_nome}")
def detalhes_time(liga_nome: str, time_nome: str):
    liga, time_obj = achar_time_cache(liga_nome, time_nome)
    if not liga:
        raise HTTPException(status_code=404, detail="Liga não encontrada")
    if not time_obj:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return serializar_time(time_obj)


# ==========================================================
# CARREIRA
# ==========================================================
@app.post("/carreira/criar")
def api_criar_carreira(body: CriarCarreiraBody):
    liga = achar_liga_cache(body.liga)
    if not liga:
        raise HTTPException(status_code=404, detail="Liga não encontrada")

    times = [t.nome for t in liga.times]
    if body.meu_time not in times:
        raise HTTPException(status_code=404, detail="Time não encontrado na liga")

    return criar_carreira(body.liga, body.meu_time, times)


@app.get("/carreira/{carreira_id}")
def api_carregar_carreira(carreira_id: int):
    try:
        return carregar_carreira(carreira_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/carreira/{carreira_id}/classificacao")
def api_classificacao(carreira_id: int):
    return gerar_tabela(carreira_id)


@app.get("/carreira/{carreira_id}/classificacao/{serie}")
def api_classificacao_serie(carreira_id: int, serie: str):
    serie = (serie or "").upper()
    if serie not in ("A", "B", "C"):
        raise HTTPException(status_code=400, detail="Serie inválida. Use A, B ou C.")
    return gerar_tabela(carreira_id, serie)


@app.get("/carreira/{carreira_id}/artilheiros")
def api_artilheiros(carreira_id: int):
    return {"carreira_id": carreira_id, "artilheiros": listar_artilheiros(carreira_id, limit=30)}


# ==========================================================
# RODADA
# ==========================================================
@app.post("/carreira/{carreira_id}/rodada/iniciar")
def api_iniciar_rodada(carreira_id: int):
    carreira = carregar_carreira(carreira_id)
    liga_nome = carreira["liga"]

    liga = achar_liga_cache(liga_nome)
    if not liga:
        raise HTTPException(status_code=404, detail="Liga não encontrada")

    times = [t.nome for t in liga.times]
    return iniciar_rodada(carreira_id, times)


@app.post("/carreira/{carreira_id}/rodada/finalizar")
def api_finalizar_rodada(carreira_id: int, body: FinalizarRodadaBody):
    try:
        return finalizar_rodada(
            carreira_id=carreira_id,
            liga=body.liga,
            rodada=body.rodada,
            jogo_usuario=body.jogo_usuario,
            placar_usuario=body.placar_usuario,
            eventos_usuario=body.eventos_usuario,
            escalacoes_usuario=body.escalacoes_usuario,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    @app.get("/debug/json")
    def debug_json():
        return {
            "total_ligas": len(LIGAS_CACHE),
            "ligas": [
                {
                    "nome": l.nome,
                    "total_times": len(getattr(l, "times", [])),
                    "primeiro_time": getattr(l.times[0], "nome", None) if getattr(l, "times", None) else None,
                    "jogadores_primeiro_time": len(getattr(l.times[0], "elenco", [])) if getattr(l, "times",
                                                                                                 None) else 0,
                }
                for l in LIGAS_CACHE
            ]
        }


# ==========================================================
# COPA DO BRASIL
# ==========================================================
@app.post("/carreira/{carreira_id}/copa/avancar")
def api_copa_avancar(carreira_id: int):
    try:
        return jogar_copa_do_brasil_proxima_fase(carreira_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    @app.get("/debug/time/{liga_nome}/{time_nome}")
    def debug_time(liga_nome: str, time_nome: str):
        liga, time_obj = achar_time_cache(liga_nome, time_nome)
        if not liga:
            return {"ok": False, "erro": "Liga não encontrada", "ligas_cache": [l.nome for l in LIGAS_CACHE]}
        if not time_obj:
            return {
                "ok": False,
                "erro": "Time não encontrado",
                "liga": liga_nome,
                "times_disponiveis": [t.nome for t in liga.times][:50],
            }

        return {
            "ok": True,
            "liga": liga_nome,
            "time": time_nome,
            "tem_elenco_attr": hasattr(time_obj, "elenco"),
            "tam_elenco": len(getattr(time_obj, "elenco", [])),
            "amostra_elenco": [j.nome for j in getattr(time_obj, "elenco", [])][:10],
        }


# ==========================================================
# MAIN
# ==========================================================

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # depois podemos restringir pro domínio do Cloudflare Pages
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://playlife-futebol-manager.pages.dev",
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://playlife-futebol-manager.pages.dev",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)