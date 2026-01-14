# backend/core/db_sqlite.py
import os
import sqlite3
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
DB_PATH = os.path.join(BASE_DIR, "data", "playlife.db")


def garantir_pasta_db():
    pasta = os.path.dirname(DB_PATH)
    os.makedirs(pasta, exist_ok=True)


def conectar():
    garantir_pasta_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_conn():
    conn = conectar()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _coluna_existe(conn: sqlite3.Connection, tabela: str, coluna: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({tabela})")
    cols = [r[1] for r in cur.fetchall()]  # r[1] = name
    return coluna in cols


def init_db():
    """
    Cria as tabelas do modo "temporadas" caso não existam.
    E cria índices SOMENTE se as colunas existirem (para não quebrar db antigo).
    """
    with get_conn() as conn:
        cur = conn.cursor()

        # temporadas (uma temporada por liga/ano)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS temporadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            liga TEXT NOT NULL,
            nome TEXT,
            criada_em TEXT DEFAULT (datetime('now'))
        );
        """)

        # times dentro da temporada
        cur.execute("""
        CREATE TABLE IF NOT EXISTS temporada_times (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temporada_id INTEGER NOT NULL,
            time_nome TEXT NOT NULL,
            logo TEXT,
            cor TEXT,
            UNIQUE(temporada_id, time_nome),
            FOREIGN KEY (temporada_id) REFERENCES temporadas(id)
        );
        """)

        # ⚠️ OBS:
        # Não crie/alterar tabela partidas aqui porque ela já existe no modo carreira
        # com schema diferente (carreira_id). Se quiser uma tabela de partidas
        # específica por temporada, use outro nome tipo "partidas_temporada".

        # classificação
        cur.execute("""
        CREATE TABLE IF NOT EXISTS classificacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temporada_id INTEGER NOT NULL,
            time_nome TEXT NOT NULL,
            jogos INTEGER DEFAULT 0,
            vitorias INTEGER DEFAULT 0,
            empates INTEGER DEFAULT 0,
            derrotas INTEGER DEFAULT 0,
            gols_pro INTEGER DEFAULT 0,
            gols_contra INTEGER DEFAULT 0,
            saldo INTEGER DEFAULT 0,
            pontos INTEGER DEFAULT 0,
            UNIQUE(temporada_id, time_nome),
            FOREIGN KEY (temporada_id) REFERENCES temporadas(id)
        );
        """)

        # ==========================
        # ÍNDICES (com verificação)
        # ==========================
        # Só cria índices se a tabela/coluna existir
        if _coluna_existe(conn, "classificacao", "temporada_id"):
            cur.execute("CREATE INDEX IF NOT EXISTS idx_classificacao_temp ON classificacao(temporada_id);")

        # Se existir tabela partidas com temporada_id, cria índices
        # (mas no seu banco atual ela não tem)
        try:
            if _coluna_existe(conn, "partidas", "temporada_id"):
                cur.execute("CREATE INDEX IF NOT EXISTS idx_partidas_temp ON partidas(temporada_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_partidas_rodada ON partidas(temporada_id, rodada);")
        except sqlite3.OperationalError:
            # tabela partidas pode não existir ainda em alguns cenários
            pass


print("✅ DB OFICIAL:", DB_PATH)
print("✅ DB EXISTE?", os.path.exists(DB_PATH))
