# backend/core/competicoes_engine.py
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any
import random


def gerar_fixtures_liga(times: List[str]) -> List[List[Tuple[str, str]]]:
    """
    Round-robin (círculo)
    retorna rodadas: lista de rodadas, rodada = lista de jogos (mandante, visitante)
    """
    times = times[:]
    if len(times) % 2 == 1:
        times.append("FOLGA")

    n = len(times)
    metade = n // 2
    times_fix = times[:]

    rodadas = []
    for r in range(n - 1):
        left = times_fix[:metade]
        right = times_fix[metade:]
        right.reverse()

        jogos = []
        for i in range(metade):
            a = left[i]
            b = right[i]
            if a == "FOLGA" or b == "FOLGA":
                continue

            if r % 2 == 0:
                jogos.append((a, b))
            else:
                jogos.append((b, a))

        rodadas.append(jogos)

        fixo = times_fix[0]
        resto = times_fix[1:]
        resto = [resto[-1]] + resto[:-1]
        times_fix = [fixo] + resto

    return rodadas


def criar_calendario_turno_returno(times: List[str]) -> List[List[Tuple[str, str]]]:
    turno = gerar_fixtures_liga(times)
    returno = [[(b, a) for (a, b) in rodada] for rodada in turno]
    return turno + returno


def simular_jogo_simples() -> Tuple[int, int]:
    return random.randint(0, 4), random.randint(0, 4)


def decidir_penaltis() -> str:
    return random.choice(["MANDANTE", "VISITANTE"])


@dataclass
class CopaConfig:
    nome: str
    participantes: List[str]
    jogo_unico_fases: int = 2  # 1ª e 2ª fase jogo único
    ida_volta_a_partir: int = 3  # oitavas em diante
    empate_penaltis: bool = True


def gerar_chaveamento(participantes: List[str]) -> List[Tuple[str, str]]:
    """
    Embaralha e cria confrontos 2 a 2
    """
    p = participantes[:]
    random.shuffle(p)
    jogos = []
    for i in range(0, len(p), 2):
        jogos.append((p[i], p[i + 1]))
    return jogos
