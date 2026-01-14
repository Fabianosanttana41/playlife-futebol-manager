// frontend/js/copa.js
import { API, apiPost } from "./api.js";

function faseLabel(fase) {
  const map = {
    "1F": "1ª Fase (64)",
    "2F": "2ª Fase (32)",
    "OIT": "Oitavas (16) • Ida/Volta",
    "QF": "Quartas (8) • Ida/Volta",
    "SF": "Semifinal (4) • Ida/Volta",
    "F": "Final (2) • Ida/Volta",
    "FIM": "Finalizado",
  };
  return map[fase] || fase || "—";
}

export function renderCopaStatus(container, data) {
  if (!container) return;

  // data pode vir do /copa/avancar ou de algum estado seu
  container.innerHTML = "";

  if (data.finalizado) {
    container.innerHTML = `
      <div class="card" style="padding:16px; border-radius:18px; border:1px solid rgba(255,255,255,0.10); background:rgba(0,0,0,0.20)">
        <div style="font-weight:1000; font-size:18px;">🏆 Copa do Brasil Finalizada</div>
        <div style="margin-top:6px; color:rgba(255,255,255,0.75)">Campeão: <b>${data.campeao || "—"}</b></div>
      </div>
    `;
    return;
  }

  const fase = data.fase || "—";
  const confrontos = data.confrontos || [];

  container.innerHTML = `
    <div class="card" style="padding:16px; border-radius:18px; border:1px solid rgba(255,255,255,0.10); background:rgba(0,0,0,0.20)">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
        <div>
          <div style="font-weight:1000; font-size:18px;">🏆 Copa do Brasil</div>
          <div style="margin-top:4px; color:rgba(255,255,255,0.75)">Fase: <b>${faseLabel(fase)}</b></div>
        </div>
        <div style="color:rgba(255,255,255,0.65); font-size:12px;">
          * 1ª/2ª: jogo único (empate = pênaltis)<br/>
          * Oitavas+: ida/volta (empate no agregado = pênaltis)
        </div>
      </div>

      <div style="height:12px"></div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:10px;" id="copaConfrontosGrid"></div>
    </div>
  `;

  const grid = container.querySelector("#copaConfrontosGrid");

  if (!confrontos.length) {
    grid.innerHTML = `<div style="color:rgba(255,255,255,0.70)">Nenhum confronto disponível.</div>`;
    return;
  }

  confrontos.forEach(([a, b]) => {
    const div = document.createElement("div");
    div.style.border = "1px solid rgba(255,255,255,0.08)";
    div.style.background = "rgba(255,255,255,0.04)";
    div.style.borderRadius = "14px";
    div.style.padding = "10px";
    div.innerHTML = `
      <div style="font-weight:900;">${a}</div>
      <div style="color:rgba(255,255,255,0.60); font-size:12px; margin:4px 0;">vs</div>
      <div style="font-weight:900;">${b}</div>
    `;
    grid.appendChild(div);
  });
}

export async function avancarCopa(carreiraId) {
  return await apiPost(`${API}/carreira/${carreiraId}/copa/avancar`);
}
