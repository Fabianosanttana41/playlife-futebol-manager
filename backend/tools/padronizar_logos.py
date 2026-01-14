import json
import re
import shutil
from pathlib import Path
from datetime import datetime

# =========================
# CONFIG
# =========================
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../futebol
JSON_PATH = PROJECT_ROOT / "backend" / "data" / "times_br.json"
LOGOS_DIR = PROJECT_ROOT / "frontend" / "assets" / "logos"

# extensões aceitas na pasta
ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".webp"]


# =========================
# HELPERS
# =========================
def slugify(text: str) -> str:
    """Transforma texto em nome padronizado para arquivo."""
    if not text:
        return ""

    t = text.strip().lower()

    # remove acentos manualmente (rápido e suficiente)
    replaces = {
        "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "í": "i", "ì": "i", "î": "i", "ï": "i",
        "ó": "o", "ò": "o", "ô": "o", "õ": "o", "ö": "o",
        "ú": "u", "ù": "u", "û": "u", "ü": "u",
        "ç": "c",
        "ñ": "n",
    }
    for a, b in replaces.items():
        t = t.replace(a, b)

    # normalização de separadores
    t = t.replace(" ", "_").replace("-", "_").replace(".", "_").replace("/", "_")

    # remove caracteres estranhos
    t = re.sub(r"[^a-z0-9_]", "", t)

    # remove underscores duplicados
    t = re.sub(r"_+", "_", t).strip("_")

    return t


def safe_backup(file_path: Path) -> Path:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = file_path.with_suffix(file_path.suffix + f".bak_{ts}")
    shutil.copy2(file_path, backup_path)
    return backup_path


def build_logo_index(logos_dir: Path):
    """
    Cria índice de arquivos existentes:
    - por nome exato (case-insensitive)
    - por slug do nome
    """
    by_lower = {}
    by_slug = {}

    for p in logos_dir.glob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in ALLOWED_EXTS:
            continue

        lower_name = p.name.lower()
        by_lower[lower_name] = p

        base = p.stem
        by_slug[slugify(base)] = p

    r
