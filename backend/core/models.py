# backend/core/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class CriarCarreiraRequest(BaseModel):
    liga: str
    meu_time: str


class SimularRodadaRequest(BaseModel):
    carreira_id: int


class IniciarPartidaAoVivoRequest(BaseModel):
    carreira_id: int
    mandante: str
    visitante: str
    tempo_segundos: int = 5
    tempos: int = 2


class SalvarEscalacaoRequest(BaseModel):
    carreira_id: int
    time: str
    formacao: str
    titulares: List[str]
