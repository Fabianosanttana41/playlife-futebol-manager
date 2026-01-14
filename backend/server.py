import os
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# =========================================================
# CONFIG
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Caso o seu arquivo de ligas fique em outro caminho, ajuste aqui:
LIGAS_JSON_PATH = DATA_DIR / "times_br.json"

# URL do Frontend em produção (Cloudflare Pages)
CLOUDFLARE_PAGES_URL = "https://playlife-futebol-manager.pages.dev"

# =========================================================
# APP
# =========================================================

app = FastAPI(title="Playlife API", version="1.0.0")

# =========================================================
# CORS (IMPORTANTE PARA Cloudflare Pages NÃO DAR "Failed to fetch")
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        CLOUDFLARE_PAGES_URL,
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.0.100:8080",  # opcional (se você usar na rede)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# CACHE (carrega ligas do JSON)
# =========================================================

LIGAS_CACHE = []


def carregar_ligas():
    global LIGAS_CACHE

    if not LIGAS_JSON_PATH.exists():
        print(f"⚠️ ARQUIVO NÃO ENCONTRADO: {LIGAS_JSON_PATH}")
        LIGAS_CACHE = []
        return

    try:
        with open(LIGAS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Se o JSON vier como dict, transforma em lista
        if isinstance(data, dict):
            data = [data]

        LIGAS_CACHE = data
        print(f"✅ LIGAS CACHE: {len(LIGAS_CACHE)} ligas carregadas do JSON")

    except Exception as e:
        print(f"❌ ERRO AO CARREGAR JSON: {e}")
        LIGAS_CACHE = []


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():
    print("✅ API iniciando...")
    print(f"📁 BASE_DIR: {BASE_DIR}")
    print(f"📁 DATA_DIR: {DATA_DIR}")
    print(f"📄 LIGAS_JSON_PATH: {LIGAS_JSON_PATH}")
    carregar_ligas()
    print("✅ API pronta.")


# =========================================================
# ROTAS
# =========================================================

@app.get("/")
def healthcheck():
    return {
        "status": "ok",
        "service": "Playlife API",
        "cors_allowed": True
    }


@app.get("/ligas")
def listar_ligas():
    # se cache estiver vazio tenta carregar novamente
    if not LIGAS_CACHE:
        carregar_ligas()

    return JSONResponse(content=LIGAS_CACHE)


@app.get("/debug")
def debug():
    return {
        "cwd": str(Path.cwd()),
        "base_dir": str(BASE_DIR),
        "data_dir": str(DATA_DIR),
        "ligas_json_path": str(LIGAS_JSON_PATH),
        "ligas_cache_count": len(LIGAS_CACHE),
        "env_port": os.environ.get("PORT")
    }


# =========================================================
# LOCAL RUN
# =========================================================

if __name__ == "__main__":
    import uvicorn

    # em produção (Render) isso vem no env PORT
    port = int(os.environ.get("PORT", 8001))

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
