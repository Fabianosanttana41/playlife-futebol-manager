import json
import os
import sys
from pathlib import Path

# =========================
# CONFIG
# =========================

PROJECT_ROOT = Path(__file__).resolve().parents[2]  # ...\futebol
BACKEND_DATA = PROJECT_ROOT / "backend" / "data"
FRONTEND_LOGOS = PROJECT_ROOT / "frontend" / "assets" / "logos"

JSON_PATH = BACKEND_DATA / "times_br.json"


# =========================
# HELPERS
# =========================

def normalize_filename(name: str) -> str:
    """
    Normaliza nome pra evitar erro por:
    - espaço
    - acento
    - caixa alta
    """
    if not name:
        return ""

    s = name.strip().lower()

    # troca caracteres comuns
    replacements = {
        " ": "_",
        "-": "_",
        "ã": "a",
        "á": "a",
        "à": "a",
        "â": "a",
        "ä": "a",
        "é": "e",
        "è": "e",
        "ê": "e",
        "ë": "e",
        "í": "i",
        "ì": "i",
        "î": "i",
        "ï": "i",
        "ó": "o",
        "ò": "o",
        "ô": "o",
        "õ": "o",
        "ö": "o",
        "ú": "u",
        "ù": "u",
        "û": "u",
        "ü": "u",
        "ç": "c",
        "ñ": "n",
    }
    for a, b in replacements.items():
        s = s.replace(a, b)

    # remove duplo "__"
    while "__" in s:
        s = s.replace("__", "_")

    return s


def fail(msg: str):
    print(f"❌ {msg}")
    return False


def ok(msg: str):
    print(f"✅ {msg}")
    return True


def warn(msg: str):
    print(f"⚠️  {msg}")


# =========================
# MAIN VALIDATION
# =========================

def main():
    print("==========================================")
    print("   PLAYLIFE - VALIDADOR DE times_br.json")
    print("==========================================\n")

    # 1) Checar arquivo JSON
    if not JSON_PATH.exists():
        print(f"❌ JSON não encontrado: {JSON_PATH}")
        sys.exit(1)

    ok(f"JSON encontrado: {JSON_PATH}")

    # 2) Carregar JSON
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        ok("JSON carregado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao carregar JSON: {e}")
        sys.exit(1)

    # 3) Entender formato
    ligas = {}

    if isinstance(data, dict) and "ligas" in data and isinstance(data["ligas"], list):
        # formato {"ligas":[{"nome":"X","times":[...]}]}
        for liga in data["ligas"]:
            nome = liga.get("nome")
            times = liga.get("times", [])
            ligas[nome] = times
        ok("Formato detectado: {'ligas':[...]}")

    elif isinstance(data, dict):
        # formato {"Campeonato Brasileiro":[...], ...}
        ligas = data
        ok("Formato detectado: {'Liga': [times...]}")
    else:
        print("❌ Formato inválido de JSON (esperado dict)")
        sys.exit(1)

    # 4) Checar pasta de escudos
    if not FRONTEND_LOGOS.exists():
        warn(f"Pasta de logos não encontrada: {FRONTEND_LOGOS}")
        warn("→ o jogo pode funcionar, mas escudos não vão carregar.")
    else:
        ok(f"Pasta de logos encontrada: {FRONTEND_LOGOS}")

    # 5) Validar dados
    total_ligas = 0
    total_times = 0
    total_jogadores = 0

    erros = 0
    alertas = 0

    for liga_nome, times in ligas.items():
        total_ligas += 1

        if not liga_nome or not isinstance(liga_nome, str):
            erros += 1
            fail("Liga sem nome ou inválida")
            continue

        if not isinstance(times, list) or len(times) == 0:
            erros += 1
            fail(f"Liga '{liga_nome}' não possui lista de times")
            continue

        print(f"\n🏆 Liga: {liga_nome} ({len(times)} times)")
        print("-" * 50)

        for t in times:
            total_times += 1

            nome_time = t.get("nome", "").strip()
            if not nome_time:
                erros += 1
                fail(f"[{liga_nome}] Time sem nome")
                continue

            # técnico
            tecnico = t.get("tecnico_dados") or t.get("tecnico") or {}
            if not isinstance(tecnico, dict):
                alertas += 1
                warn(f"{nome_time}: tecnico_dados inválido (não é objeto)")
            else:
                tecnico_nome = tecnico.get("nome") or ""
                if not tecnico_nome or tecnico_nome.lower() in ("sem tecnico", "sem técnico"):
                    alertas += 1
                    warn(f"{nome_time}: técnico ausente ou 'Sem técnico'")

            # elenco
            elenco = t.get("elenco", [])
            if not isinstance(elenco, list):
                erros += 1
                fail(f"{nome_time}: campo 'elenco' inválido (não é lista)")
                continue

            if len(elenco) == 0:
                erros += 1
                fail(f"{nome_time}: elenco vazio")
            elif len(elenco) < 18:
                alertas += 1
                warn(f"{nome_time}: elenco pequeno ({len(elenco)} jogadores)")

            # validar jogadores
            for j in elenco:
                total_jogadores += 1
                if not isinstance(j, dict):
                    erros += 1
                    fail(f"{nome_time}: jogador inválido (não é objeto)")
                    continue

                j_nome = (j.get("nome") or "").strip()
                j_pos = (j.get("posicao") or "").strip()
                j_forca = j.get("forca")

                if not j_nome:
                    erros += 1
                    fail(f"{nome_time}: jogador sem nome")
                if not j_pos:
                    alertas += 1
                    warn(f"{nome_time}: jogador '{j_nome or '??'}' sem posição")

                if j_forca is None:
                    alertas += 1
                    warn(f"{nome_time}: jogador '{j_nome or '??'}' sem força")
                else:
                    try:
                        fval = int(j_forca)
                        if fval < 1 or fval > 99:
                            alertas += 1
                            warn(f"{nome_time}: força fora do intervalo (1-99): {j_nome}={fval}")
                    except:
                        alertas += 1
                        warn(f"{nome_time}: força inválida (não número): {j_nome}={j_forca}")

            # logo
            logo = (t.get("logo") or "").strip()
            if not logo:
                alertas += 1
                warn(f"{nome_time}: campo logo vazio")
            else:
                # checar se existe arquivo no frontend
                if FRONTEND_LOGOS.exists():
                    logo_path = FRONTEND_LOGOS / logo
                    if not logo_path.exists():
                        # tentativa normalizada: time.png
                        guess1 = FRONTEND_LOGOS / f"{normalize_filename(nome_time)}.png"
                        if guess1.exists():
                            warn(f"{nome_time}: logo '{logo}' não encontrado → mas existe '{guess1.name}'")
                            alertas += 1
                        else:
                            erros += 1
                            fail(f"{nome_time}: logo não encontrado no frontend: {logo_path}")

    # resumo
    print("\n==========================================")
    print("📌 RESULTADO FINAL")
    print("==========================================")
    print(f"🏆 Ligas: {total_ligas}")
    print(f"🏟️ Times: {total_times}")
    print(f"👤 Jogadores: {total_jogadores}")
    print(f"❌ Erros: {erros}")
    print(f"⚠️ Alertas: {alertas}")

    if erros > 0:
        print("\n❌ VALIDAÇÃO FALHOU: corrija os erros acima.")
        sys.exit(1)

    print("\n✅ VALIDAÇÃO OK: JSON pronto para uso.")
    sys.exit(0)


if __name__ == "__main__":
    main()
