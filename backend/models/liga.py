from dataclasses import dataclass, field
from .time import Time

@dataclass
class Liga:
    nome: str
    times: list[Time] = field(default_factory=list)
