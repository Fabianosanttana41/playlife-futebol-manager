from dataclasses import dataclass, field
from .tecnico import Tecnico
from .jogador import Jogador

@dataclass
class Time:
    nome: str
    cor: str
    logo: str

    uniforme_home: str | None = None
    uniforme_away: str | None = None

    tecnico: Tecnico | None = None
    elenco: list[Jogador] = field(default_factory=list)
