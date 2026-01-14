// frontend/js/confronto_live.js
// ======================================================
// MATCH AO VIVO 90min SIMULADO EM 12s (2x6s)
// + Tática: Defender / Equilibrado / Atacar
// ======================================================

let tatica = "EQ";           // DEF | EQ | ATK
let live12sTimer = null;     // intervalo principal
let liveRunning = false;

function $(id){ return document.getElementById(id); }

function stopLive12s(){
  if(live12sTimer){
    clearInterval(live12sTimer);
    live12sTimer = null;
  }
  liveRunning = false;
}

function setTactic(t){
  tatica = t;

  const tacDef = $("tacDef");
  const tacEq  = $("tacEq");
  const tacAtk = $("tacAtk");
  const tacticLabel = $("tacticLabel");

  if (!tacDef || !tacEq || !tacAtk || !tacticLabel) return;

  tacDef.classList.remove("tacActive");
  tacEq.classList.remove("tacActive");
  tacAtk.classList.remove("tacActive");

  if(t === "DEF"){
    tacDef.classList.add("tacActive");
    tacticLabel.textContent = "Defender";
  } else if(t === "ATK"){
    tacAtk.classList.add("tacActive");
    tacticLabel.textContent = "Atacar";
  } else {
    tacEq.classList.add("tacActive");
    tacticLabel.textContent = "Equilibrado";
  }
}

function getConfigTatica(t){
  // Probabilidades por segundo (tick)
  if(t === "DEF") return { pGolPro: 0.03, pGolContra: 0.02, pCartao: 0.04 };
  if(t === "ATK") return { pGolPro: 0.12, pGolContra: 0.10, pCartao: 0.06 };
  return { pGolPro: 0.07, pGolContra: 0.07, pCartao: 0.05 }; // EQ
}

function chance(p){ return Math.random() < p; }

function fmtClockMinute(min){
  return `${String(min).padStart(2,"0")}:00`;
}

function resetSumula(){
  const sumula = $("sumulaBox");
  if(sumula) sumula.innerHTML = "";
}

function addSumulaText(html){
  const sumula = $("sumulaBox");
  if(!sumula) return;

  const div = document.createElement("div");
  div.className = "ev";
  div.innerHTML = html;
  sumula.prepend(div);
}

function atualizarPlacar(gm, gv){
  const placar = $("placarLive");
  if(placar) placar.textContent = `${gm} x ${gv}`;
}

function atualizarClock(minutoDisplay, half){
  const clock = $("clockLive");
  if(clock) clock.textContent = `${fmtClockMinute(minutoDisplay)} • ${half}º tempo`;
}

function iniciarMatchAoVivo12s(){
  if(liveRunning) return;
  liveRunning = true;

  stopLive12s();

  const TEMPO_TOTAL_SEG = 12;
  const TEMPO_POR_TEMPO = 6;
  const TOTAL_MINUTOS = 90;

  let sec = 0;
  let golsM = 0;
  let golsV = 0;

  const mandanteNome = $("nomeMandante")?.textContent || "Mandante";
  const visitanteNome = $("nomeVisitante")?.textContent || "Visitante";

  const eventos = [];

  resetSumula();
  atualizarPlacar(0,0);
  atualizarClock(0,1);

  addSumulaText(`<b>0'</b> • Início de jogo 🏁`);

  const btnStart = $("btnStart12s");
  if(btnStart){
    btnStart.disabled = true;
    btnStart.textContent = "⏱️ Jogando...";
  }

  live12sTimer = setInterval(() => {
    sec += 1;

    const minutoGeral = Math.max(1, Math.floor((sec / TEMPO_TOTAL_SEG) * TOTAL_MINUTOS));
    const half = sec <= TEMPO_POR_TEMPO ? 1 : 2;

    let minutoDisplay = 0;
    if(half === 1){
      minutoDisplay = Math.floor((sec / TEMPO_POR_TEMPO) * 45);
    } else {
      minutoDisplay = 45 + Math.floor(((sec - TEMPO_POR_TEMPO) / TEMPO_POR_TEMPO) * 45);
    }

    atualizarClock(minutoDisplay, half);

    if(sec === TEMPO_POR_TEMPO){
      addSumulaText(`<b>45'</b> • Intervalo ⏸️`);
    }

    const cfg = getConfigTatica(tatica);

    // GOL a favor do usuário (mandante)
    if(chance(cfg.pGolPro)){
      golsM++;
      const jogador = "Atacante";
      eventos.push({ minuto: minutoGeral, tipo: "GOL", time: mandanteNome, jogador });
      addSumulaText(`<b>${minutoGeral}'</b> • ${mandanteNome} • GOL ⚽ (${jogador})`);
    }

    // GOL contra
    if(chance(cfg.pGolContra)){
      golsV++;
      const jogador = "Atacante";
      eventos.push({ minuto: minutoGeral, tipo: "GOL", time: visitanteNome, jogador });
      addSumulaText(`<b>${minutoGeral}'</b> • ${visitanteNome} • GOL ⚽ (${jogador})`);
    }

    // Cartão
    if(chance(cfg.pCartao)){
      const timeCartao = Math.random() < 0.5 ? mandanteNome : visitanteNome;
      eventos.push({ minuto: minutoGeral, tipo: "CARTAO", time: timeCartao, jogador: null });
      addSumulaText(`<b>${minutoGeral}'</b> • ${timeCartao} • Cartão 🟨`);
    }

    atualizarPlacar(golsM, golsV);

    if(sec >= TEMPO_TOTAL_SEG){
      stopLive12s();
      addSumulaText(`<b>90'</b> • Fim de jogo 🏁`);
      addSumulaText(`<b>Placar final:</b> ${mandanteNome} ${golsM} x ${golsV} ${visitanteNome}`);

      if(btnStart){
        btnStart.disabled = false;
        btnStart.textContent = "⏱️ Iniciar partida (12s)";
      }

      liveRunning = false;

      // ✅ depois vamos integrar com backend:
      // finalizarRodadaComResultado(golsM, golsV, eventos);

      console.log("MATCH FINALIZADO", {
        placar: { mandante: golsM, visitante: golsV },
        eventos
      });
    }
  }, 1000);
}

// ======================================================
// Bind dos botões
// ======================================================
export function bindConfrontoLiveUI(){
  const tacDef = $("tacDef");
  const tacEq  = $("tacEq");
  const tacAtk = $("tacAtk");
  const btnStart = $("btnStart12s");

  if(tacDef) tacDef.addEventListener("click", () => setTactic("DEF"));
  if(tacEq)  tacEq.addEventListener("click", () => setTactic("EQ"));
  if(tacAtk) tacAtk.addEventListener("click", () => setTactic("ATK"));

  if(btnStart) btnStart.addEventListener("click", iniciarMatchAoVivo12s);

  setTactic("EQ");
}

// Se você carregar a tela confronto por botão, pode chamar bind no final.
// Aqui tentamos bindar automaticamente:
window.addEventListener("DOMContentLoaded", () => {
  bindConfrontoLiveUI();
});
