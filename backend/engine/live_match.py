# backend/engine/live_match.py
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Any, List
import random
import time

# armazenamento em memória (sessões de partidas ao vivo)
LIVE_MATCHES: Dict[int, "LiveMatch"] = {}
NEXT_ID = 1


def _now():
    return time.time()


def _pick_events_probability(minuto: int):
    """
    Probabilidades simples por minuto (0..90).
    """
    return {
        "GOL": 0.05,
        "CARTAO": 0.04,
        "LESAO": 0.02,
    }


@dataclass
class LiveMatch:
    id: int
    liga: str
    mandante: Dict[str, Any]
    visitante: Dict[str, Any]

    titulares_m: List[Dict[str, Any]]
    reservas_m: List[Dict[str, Any]]
    titulares_v: List[Dict[str, Any]]
    reservas_v: List[Dict[str, Any]]

    tempo_total: int = 90  # segundos
    started_at: float = field(default_factory=_now)

    minuto_atual: int = 0  # 0..90
    score_m: int = 0
    score_v: int = 0

    substituicoes_m: int = 0
    substituicoes_v: int = 0
    limite_subs: int = 3

    eventos: List[Dict[str, Any]] = field(default_factory=list)

    def serialize(self) -> Dict[str, Any]:
        return {
            "match_id": self.id,
            "liga": self.liga,
            "tempo_total": self.tempo_total,
            "minuto_atual": self.minuto_atual,
            "placar": {"mandante": self.score_m, "visitante": self.score_v},
            "mandante": self.mandante,
            "visitante": self.visitante,
            "escalacoes": {
                "mandante": {"titulares": self.titulares_m, "reservas": self.reservas_m},
                "visitante": {"titulares": self.titulares_v, "reservas": self.reservas_v},
            },
            "substituicoes": {
                "mandante": self.substituicoes_m,
                "visitante": self.substituicoes_v,
                "limite": self.limite_subs,
            },
        }

    def tick(self) -> List[Dict[str, Any]]:
        """
        Avança a partida conforme o tempo real decorrido:
        1 segundo = 1 minuto
        """
        elapsed = int(_now() - self.started_at)
        new_minute = min(self.tempo_total, elapsed)

        if new_minute <= self.minuto_atual:
            return []

        eventos_novos: List[Dict[str, Any]] = []

        for minuto in range(self.minuto_atual + 1, new_minute + 1):
            self.minuto_atual = minuto
            eventos_novos.extend(self._generate_events(minuto))

        return eventos_novos

    def finished(self) -> bool:
        return self.minuto_atual >= self.tempo_total

    def _generate_events(self, minuto: int) -> List[Dict[str, Any]]:
        """
        Gera eventos do minuto.
        """
        probs = _pick_events_probability(minuto)
        eventos: List[Dict[str, Any]] = []

        # chance geral de ter algum evento no minuto
        if random.random() > 0.18:
            return []

        # escolhe tipo do evento
        tipos = list(probs.keys())
        pesos = list(probs.values())
        tipo = random.choices(tipos, weights=pesos, k=1)[0]

        side = random.choice(["mandante", "visitante"])

        if tipo == "GOL":
            if side == "mandante":
                self.score_m += 1
                jogador = random.choice(self.titulares_m)["nome"]
                time_nome = self.mandante["nome"]
            else:
                self.score_v += 1
                jogador = random.choice(self.titulares_v)["nome"]
                time_nome = self.visitante["nome"]

            eventos.append({
                "minuto": minuto,
                "time": time_nome,
                "tipo": "GOL",
                "jogador": jogador
            })

        elif tipo == "CARTAO":
            if side == "mandante":
                jogador = random.choice(self.titulares_m)["nome"]
                time_nome = self.mandante["nome"]
            else:
                jogador = random.choice(self.titulares_v)["nome"]
                time_nome = self.visitante["nome"]

            eventos.append({
                "minuto": minuto,
                "time": time_nome,
                "tipo": random.choice(["CARTAO AMARELO", "CARTAO VERMELHO"]),
                "jogador": jogador
            })

        elif tipo == "LESAO":
            if side == "mandante":
                j = random.choice(self.titulares_m)
                j["lesao"] = True
                jogador = j["nome"]
                time_nome = self.mandante["nome"]
            else:
                j = random.choice(self.titulares_v)
                j["lesao"] = True
                jogador = j["nome"]
                time_nome = self.visitante["nome"]

            eventos.append({
                "minuto": minuto,
                "time": time_nome,
                "tipo": "LESAO",
                "jogador": jogador
            })

        # registrar eventos no histórico
        for e in eventos:
            self.eventos.append(e)

        return eventos


def create_live_match(payload: Dict[str, Any]) -> LiveMatch:
    global NEXT_ID
    match_id = NEXT_ID
    NEXT_ID += 1

    lm = LiveMatch(
        id=match_id,
        liga=payload["liga"],
        mandante=payload["mandante"],
        visitante=payload["visitante"],

        titulares_m=payload["titulares_m"],
        reservas_m=payload["reservas_m"],
        titulares_v=payload["titulares_v"],
        reservas_v=payload["reservas_v"],

        tempo_total=int(payload.get("tempo_total", 90)),
    )

    LIVE_MATCHES[match_id] = lm
    return lm


def get_match(match_id: int) -> LiveMatch:
    if match_id not in LIVE_MATCHES:
        raise ValueError("Partida ao vivo não encontrada")
    return LIVE_MATCHES[match_id]


def substituicao(match_id: int, side: str, sai: str, entra: str) -> Dict[str, Any]:
    """
    side: "mandante" ou "visitante"
    """
    m = get_match(match_id)

    if side not in ("mandante", "visitante"):
        raise ValueError("time inválido")

    if side == "mandante":
        if m.substituicoes_m >= m.limite_subs:
            raise ValueError("Limite de substituições atingido")
        titulares = m.titulares_m
        reservas = m.reservas_m
        time_nome = m.mandante["nome"]
    else:
        if m.substituicoes_v >= m.limite_subs:
            raise ValueError("Limite de substituições atingido")
        titulares = m.titulares_v
        reservas = m.reservas_v
        time_nome = m.visitante["nome"]

    j_sai = next((j for j in titulares if j["nome"] == sai), None)
    j_entra = next((j for j in reservas if j["nome"] == entra), None)

    if not j_sai:
        raise ValueError("Jogador 'sai' não está entre titulares")
    if not j_entra:
        raise ValueError("Jogador 'entra' não está entre reservas")

    titulares.remove(j_sai)
    reservas.remove(j_entra)

    titulares.append(j_entra)
    reservas.append(j_sai)

    if side == "mandante":
        m.substituicoes_m += 1
    else:
        m.substituicoes_v += 1

    ev = {
        "minuto": m.minuto_atual,
        "time": time_nome,
        "tipo": "SUBSTITUICAO",
        "sai": sai,
        "entra": entra
    }

    m.eventos.append(ev)
    return ev
