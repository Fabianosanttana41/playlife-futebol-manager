from dataclasses import dataclass, field

@dataclass
class Jogador:
    nome: str
    posicao: str
    forca: int
    nacionalidade: str = "br"

    # novos dados
    idade: int | None = None
    altura: int | None = None
    pe: str | None = None  # "D", "E", "A"

    # status
    lesao: bool = False

    atributos: dict = field(default_factory=dict)
