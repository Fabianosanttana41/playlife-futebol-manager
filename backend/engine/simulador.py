import random


def forca_time(jogadores):
    if not jogadores:
        return 70
    return sum(j.get("forca", 70) for j in jogadores) / len(jogadores)


def simular_partida(timeA: dict, timeB: dict):
    """
    timeA e timeB: dict com {nome, elenco}
    """
    # força média
    forcaA = forca_time(timeA["elenco"])
    forcaB = forca_time(timeB["elenco"])

    # posse (proporcional)
    total = forcaA + forcaB
    posseA = int((forcaA / total) * 100)
    posseB = 100 - posseA

    # chutes
    chutesA = max(1, int(random.randint(6, 18) * (forcaA / 80)))
    chutesB = max(1, int(random.randint(6, 18) * (forcaB / 80)))

    no_alvoA = max(0, int(chutesA * random.uniform(0.25, 0.55)))
    no_alvoB = max(0, int(chutesB * random.uniform(0.25, 0.55)))

    # gols
    golsA = max(0, int(no_alvoA * random.uniform(0.15, 0.35)))
    golsB = max(0, int(no_alvoB * random.uniform(0.15, 0.35)))

    eventos = []
    for _ in range(golsA):
        minuto = random.randint(1, 90)
        j = random.choice(timeA["elenco"])
        eventos.append({"minuto": minuto, "time": timeA["nome"], "tipo": "GOL", "jogador": j["nome"]})

    for _ in range(golsB):
        minuto = random.randint(1, 90)
        j = random.choice(timeB["elenco"])
        eventos.append({"minuto": minuto, "time": timeB["nome"], "tipo": "GOL", "jogador": j["nome"]})

    eventos.sort(key=lambda e: e["minuto"])

    destaque = None
    if eventos:
        destaque = random.choice(eventos)["jogador"]

    return {
        "mandante": {"nome": timeA["nome"]},
        "visitante": {"nome": timeB["nome"]},
        "placar": {"mandante": golsA, "visitante": golsB},
        "estatisticas": {
            "posse": {"mandante": posseA, "visitante": posseB},
            "chutes": {"mandante": chutesA, "visitante": chutesB},
            "no_alvo": {"mandante": no_alvoA, "visitante": no_alvoB},
        },
        "eventos": eventos,
        "destaque": destaque,
    }
