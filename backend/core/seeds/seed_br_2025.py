# backend/core/seeds/seed_br_2025.py
"""
SEED Brasil 2025 -> usado para montar temporada 2026
Obs: você pode refinar as listas depois, mas já deixo:
- promovidos/rebaixados reais da Série C
- promovidos reais da Série D para compor Série C 2026
"""

# ✅ Série C 2025: promovidos (sobem para Série B 2026)
SERIE_C_2025_PROMOVIDOS = [
    "Ponte Preta",
    "Londrina",
    "São Bernardo",
    "Náutico",
]

# ✅ Série C 2025: rebaixados (caem para Série D 2026)
SERIE_C_2025_REBAIXADOS = [
    "Tombense",
    "Retrô",
    "ABC",
    "CSA",
]

# ✅ Série D 2025: promovidos (sobem para Série C 2026)
SERIE_D_2025_PROMOVIDOS = [
    "Inter de Limeira",
    "Barra",
    "Maranhão",
    "Santa Cruz",
]

# ===========================
# Para Série A e Série B:
# você já tem os times no seu core.database (carregar_sistema_completo)
# então vamos usar o que existir na liga.
# Esse seed é usado principalmente para regras de A/B/C e Copa.
# ===========================
