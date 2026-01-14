# backend/core/database.py
import json
import os

from models.liga import Liga
from models.time import Time
from models.tecnico import Tecnico
from models.jogador import Jogador

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
DATA_PATH = os.path.join(BASE_DIR, "data", "times_br.json")


# ✅ Fallback padrão (para nunca quebrar o servidor)
DEFAULT_DATA = {
    "Campeonato Brasileiro": [
        {"nome": "Flamengo", "cor": "#ff0000", "logo": "", "elenco": []},
        {"nome": "Palmeiras", "cor": "#00aa00", "logo": "", "elenco": []},
        {"nome": "Botafogo", "cor": "#111111", "logo": "", "elenco": []},
        {"nome": "Corinthians", "cor": "#000000", "logo": "", "elenco": []},
        {"nome": "Fluminense", "cor": "#006633", "logo": "", "elenco": []},
        {"nome": "Grêmio", "cor": "#00aaff", "logo": "", "elenco": []},
        {"nome": "Cruzeiro", "cor": "#0033ff", "logo": "", "elenco": []},
        {"nome": "Atlético-MG", "cor": "#222222", "logo": "", "elenco": []},
        {"nome": "Internacional", "cor": "#cc0000", "logo": "", "elenco": []},
        {"nome": "Bahia", "cor": "#0033aa", "logo": "", "elenco": []},
        {"nome": "Fortaleza", "cor": "#002255", "logo": "", "elenco": []},
        {"nome": "Bragantino", "cor": "#cc0000", "logo": "", "elenco": []},
        {"nome": "Santos", "cor": "#ffffff", "logo": "", "elenco": []}
    ]
}


def _garantir_arquivo_times():
    """
    ✅ Se o arquivo não existir, cria automaticamente.
    Assim seu servidor NUNCA cai por falta do times_br.json.
    """
    pasta = os.path.dirname(DATA_PATH)
    os.makedirs(pasta, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)
        print(f"✅ Criado automaticamente: {DATA_PATH}")

    # Arquivo existe mas está vazio?
    try:
        if os.path.getsize(DATA_PATH) == 0:
            with open(DATA_PATH, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=2)
            print(f"⚠️ Arquivo estava vazio. Restaurado: {DATA_PATH}")
    except Exception:
        pass


def _carregar_json_com_fallback():
    """
    ✅ Carrega o JSON.
    Se estiver inválido/corrompido, usa fallback e não derruba o servidor.
    """
    _garantir_arquivo_times()

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("⚠️ times_br.json inválido (JSON quebrado). Usando DEFAULT_DATA.")
        return DEFAULT_DATA
    except Exception as e:
        print(f"⚠️ Erro ao ler times_br.json: {e}. Usando DEFAULT_DATA.")
        return DEFAULT_DATA


def carregar_sistema_completo():
    """
    Aceita estes formatos:
    1) {"Campeonato Brasileiro":[{time},{time}]}
    2) {"ligas":[{"nome":"Campeonato Brasileiro","times":[...] }]}
    """
    dados = _carregar_json_com_fallback()

    ligas: list[Liga] = []

    # ✅ FORMATO 1: {"Campeonato Brasileiro": [ ...times... ]}
    if isinstance(dados, dict) and "ligas" not in dados:
        for nome_liga, lista_times in dados.items():
            # pula se não for lista (segurança)
            if not isinstance(lista_times, list):
                continue

            liga = Liga(nome=nome_liga, times=[])
            for t in lista_times:
                # se alguém colocou string ao invés de dict
                if isinstance(t, str):
                    t = {"nome": t}

                if isinstance(t, dict):
                    liga.times.append(_criar_time(t))

            ligas.append(liga)
        return ligas

    # ✅ FORMATO 2: {"ligas":[{"nome":"X","times":[...]}]}
    if isinstance(dados, dict) and "ligas" in dados:
        for liga_json in dados.get("ligas", []):
            if not isinstance(liga_json, dict):
                continue

            liga = Liga(nome=liga_json.get("nome", "Liga"), times=[])

            for t in liga_json.get("times", []):
                if isinstance(t, str):
                    t = {"nome": t}

                if isinstance(t, dict):
                    liga.times.append(_criar_time(t))

            ligas.append(liga)
        return ligas

    # ✅ se o arquivo veio num formato estranho
    print(f"⚠️ Formato de times_br.json não reconhecido ({type(dados)}). Usando fallback.")
    # fallback final
    dados = DEFAULT_DATA
    ligas = []
    for nome_liga, lista_times in dados.items():
        liga = Liga(nome=nome_liga, times=[])
        for t in lista_times:
            liga.times.append(_criar_time(t))
        ligas.append(liga)
    return ligas


def _criar_time(t: dict) -> Time:
    tecnico_json = t.get("tecnico_dados", {}) or {}
    tecnico = Tecnico(
        nome=tecnico_json.get("nome", "Sem técnico"),
        nacionalidade=tecnico_json.get("nacionalidade", "br"),
    )

    elenco = []
    for j in t.get("elenco", []):
        if not isinstance(j, dict):
            continue

        jogador = Jogador(
            nome=j.get("nome", "Jogador"),
            posicao=j.get("posicao", "MEI"),
            forca=int(j.get("forca", 70)),
            nacionalidade=j.get("nacionalidade", "br"),
            idade=j.get("idade"),
            altura=j.get("altura"),
            pe=j.get("pe"),
            lesao=bool(j.get("lesao", False)),
            atributos=j.get("atributos", {}) or {},
        )
        elenco.append(jogador)

    return Time(
        nome=t.get("nome", "Time"),
        cor=t.get("cor", "#ffffff"),
        logo=t.get("logo", ""),
        uniforme_home=t.get("uniforme_home"),
        uniforme_away=t.get("uniforme_away"),
        tecnico=tecnico,
        elenco=elenco,
    )
