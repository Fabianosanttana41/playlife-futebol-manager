// frontend/js/campeonato.js
import { API, apiPost, apiGet } from "./api.js";
import { avancarCopa, renderCopaStatus } from "./copa.js";

export function bindCampeonatoUI(opts) {
  const {
    btnCampeonato,
    carreiraIdGetter,
    copaContainer,
    btnAvancarCopa,
    btnTabelaA,
    tabelaContainer,
  } = opts;

  if (btnCampeonato) {
    btnCampeonato.addEventListener("click", async () => {
      alert("Campeonato: agora já dá para avançar Copa do Brasil ✅");
    });
  }

  // Avançar fase copa
  if (btnAvancarCopa) {
    btnAvancarCopa.addEventListener("click", async () => {
      const carreiraId = carreiraIdGetter();
      if (!carreiraId) {
        alert("Crie uma carreira primeiro!");
        return;
      }

      btnAvancarCopa.disabled = true;
      btnAvancarCopa.textContent = "Avançando...";

      try {
        const r = await avancarCopa(carreiraId);
        renderCopaStatus(copaContainer, r);
      } catch (e) {
        alert("Erro: " + e.message);
      } finally {
        btnAvancarCopa.disabled = false;
        btnAvancarCopa.textContent = "Avançar Copa do Brasil";
      }
    });
  }

  // Mostrar tabela Série A
  if (btnTabelaA) {
    btnTabelaA.addEventListener("click", async () => {
      const carreiraId = carreiraIdGetter();
      if (!carreiraId) {
        alert("Crie uma carreira primeiro!");
        return;
      }

      try {
        const tabela = await apiGet(`${API}/carreira/${carreiraId}/classificacao/A`);
        renderTabela(tabelaContainer, tabela, "Série A");
      } catch (e) {
        alert("Erro ao carregar tabela: " + e.message);
      }
    });
  }
}

function renderTabela(container, tabela, titulo) {
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="padding:16px; border-radius:18px; border:1px solid rgba(255,255,255,0.10); background:rgba(0,0,0,0.20)">
      <div style="font-weight:1000; font-size:18px;">📊 ${titulo}</div>
      <div style="height:10px"></div>
      <div style="overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="text-align:left; color:rgba(255,255,255,0.75);">
              <th style="padding:8px;">#</th>
              <th style="padding:8px;">Clube</th>
              <th style="padding:8px;">PTS</th>
              <th style="padding:8px;">J</th>
              <th style="padding:8px;">V</th>
              <th style="padding:8px;">E</th>
              <th style="padding:8px;">D</th>
              <th style="padding:8px;">GP</th>
              <th style="padding:8px;">GC</th>
              <th style="padding:8px;">SG</th>
            </tr>
          </thead>
          <tbody id="tbodyTabela"></tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = container.querySelector("#tbodyTabela");

  tabela.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.style.borderTop = "1px solid rgba(255,255,255,0.06)";
    tr.innerHTML = `
      <td style="padding:8px;">${i + 1}</td>
      <td style="padding:8px; font-weight:900;">${t.nome}</td>
      <td style="padding:8px; font-weight:900;">${t.pontos}</td>
      <td style="padding:8px;">${t.jogos}</td>
      <td style="padding:8px;">${t.vitorias}</td>
      <td style="padding:8px;">${t.empates}</td>
      <td style="padding:8px;">${t.derrotas}</td>
      <td style="padding:8px;">${t.gp}</td>
      <td style="padding:8px;">${t.gc}</td>
      <td style="padding:8px;">${t.saldo}</td>
    `;
    tbody.appendChild(tr);
  });
}
