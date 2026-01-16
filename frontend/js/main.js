// frontend/js/main.js
import { apiGet } from "./api.js";

// ================================
// ELEMENTOS DA TELA
// ================================

// selects
const ligaSelect = document.getElementById("ligaSelect");
const timeSelect = document.getElementById("timeSelect");

// botões
const btnCarregarClube = document.getElementById("btnCarregarClube");
const btnConfronto = document.getElementById("btnConfronto");
const btnLimpar = document.getElementById("btnLimpar");

// textos/labels
const statusMsg = document.getElementById("statusMsg"); // uma <div> ou <span> para mensagens
const tecnicoNome = document.getElementById("tecnicoNome");
const forcaMedia = document.getElementById("forcaMedia");
const elencoQtd = document.getElementById("elencoQtd");

// lista elenco
const elencoLista = document.getElementById("elencoLista");

// imagens (logo/uniforme)
const imgLogo = document.getElementById("imgLogo");
const imgUniforme = document.getElementById("imgUniforme");

// filtros (se existirem)
const filtroTodos = document.getElementById("filtroTodos");
const filtroGOL = document.getElementById("filtroGOL");
const filtroDEF = document.getElementById("filtroDEF");
const filtroMEI = document.getElementById("filtroMEI");
const filtroATA = document.getElementById("filtroATA");

// busca
const inputBusca = document.getElementById("inputBusca");

// ================================
// ESTADO
// ================================
let ligasCache = [];
let timeAtual = null;
let elencoAtual = [];

// ================================
// HELPERS
// ================================
function setMsg(texto = "", tipo = "") {
  if (!statusMsg) return;
  statusMsg.textContent = texto;

  statusMsg.classList.remove("ok", "erro", "info");
  if (tipo) statusMsg.classList.add(tipo);
}

function clearTelaClube() {
  timeAtual = null;
  elencoAtual = [];

  if (tecnicoNome) tecnicoNome.textContent = "--";
  if (forcaMedia) forcaMedia.textContent = "--";
  if (elencoQtd) elencoQtd.textContent = "0";

  if (imgLogo) imgLogo.src = "";
  if (imgUniforme) imgUniforme.src = "";

  renderElenco([]);
}

function calcForcaMedia(jogadores) {
  if (!jogadores || jogadores.length === 0) return 0;
  const soma = jogadores.reduce((acc, j) => acc + (Number(j.forca) || 0), 0);
  return Math.round(soma / jogadores.length);
}

function renderElenco(lista) {
  if (!elencoLista) return;

  elencoLista.innerHTML = "";

  if (!lista || lista.length === 0) {
    elencoLista.innerHTML = `<div class="vazio">Nenhum jogador carregado</div>`;
    return;
  }

  for (const j of lista) {
    const div = document.createElement("div");
    div.className = "jogador";
    div.innerHTML = `
      <div class="j-nome">${j.nome}</div>
      <div class="j-info">${j.posicao} • Força ${j.forca} • ${j.nacionalidade || ""}</div>
    `;
    elencoLista.appendChild(div);
  }
}

function aplicarFiltroEBusca() {
  const termo = (inputBusca?.value || "").trim().toLowerCase();

  // filtro ativo (classes "active" no botão, etc.)
  let filtro = "Todos";
  const ativo = document.querySelector(".filtro.active");
  if (ativo?.dataset?.pos) filtro = ativo.dataset.pos;

  let lista = [...elencoAtual];

  if (filtro !== "Todos") {
    lista = lista.filter((j) => j.posicao === filtro);
  }

  if (termo) {
    lista = lista.filter((j) => (j.nome || "").toLowerCase().includes(termo));
  }

  renderElenco(lista);
}

// ================================
// CARREGAMENTO DE DADOS
// ================================

async function carregarLigas() {
  setMsg("Carregando ligas...", "info");

  try {
    ligasCache = await apiGet("/ligas");

    if (!Array.isArray(ligasCache)) {
      throw new Error("Resposta de /ligas não é uma lista");
    }

    // ✅ LIMPA E PREENCHE SELECT (COM STRING)
    if (ligaSelect) {
      ligaSelect.innerHTML = `<option value="">Selecione a liga</option>`;

      ligasCache.forEach((liga) => {
        const opt = document.createElement("option");

        // ✅ CORRETO: value só recebe TEXTO
        opt.value = liga.nome;
        opt.textContent = liga.nome;

        ligaSelect.appendChild(opt);
      });
    }

    // limpa select de times
    if (timeSelect) {
      timeSelect.innerHTML = `<option value="">Selecione o time</option>`;
    }

    setMsg("Ligas carregadas ✅", "ok");
  } catch (err) {
    console.error(err);
    setMsg("Erro ao carregar ligas: " + err.message, "erro");
  }
}

async function carregarTimesDaLiga(nomeLiga) {
  setMsg("Carregando times da liga...", "info");

  try {
    if (!nomeLiga) return;

    // ✅ encode no nome da liga
    const times = await apiGet(`/times/${encodeURIComponent(nomeLiga)}`);

    if (!Array.isArray(times)) {
      throw new Error("Resposta de /times/{liga} não é uma lista");
    }

    // ✅ Preenche select de times com STRING
    if (timeSelect) {
      timeSelect.innerHTML = `<option value="">Selecione o time</option>`;

      times.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.nome;          // ✅ string
        opt.textContent = t.nome;    // ✅ string
        timeSelect.appendChild(opt);
      });
    }

    setMsg("Times carregados ✅", "ok");
  } catch (err) {
    console.error(err);
    setMsg("Falha ao carregar times: " + err.message, "erro");
  }
}

async function carregarClubeCompleto(nomeLiga, nomeTime) {
  setMsg("Carregando clube e elenco...", "info");

  try {
    if (!nomeLiga || !nomeTime) {
      setMsg("Selecione liga e time.", "erro");
      return;
    }

    // pega liga no cache
    const liga = ligasCache.find((l) => l.nome === nomeLiga);
    if (!liga) throw new Error("Liga não encontrada no cache");

    // pega time dentro da liga (se vier assim no JSON)
    let time = null;
    if (Array.isArray(liga.times)) {
      time = liga.times.find((t) => t.nome === nomeTime);
    }

    // fallback: buscar time por endpoint (se você tiver)
    // (se não tiver esse endpoint, ignora)
    if (!time) {
      // tenta achar na API /times/{liga} (já buscamos antes)
      // ou cria objeto mínimo
      time = { nome: nomeTime };
    }

    timeAtual = time;

    // Atualiza logo/uniforme se existir
    if (imgLogo) {
      imgLogo.src = time.logo ? `assets/img/${time.logo}` : "";
    }
    if (imgUniforme) {
      imgUniforme.src = time.uniforme ? `assets/img/${time.uniforme}` : "";
    }

    // técnico
    if (tecnicoNome) {
      tecnicoNome.textContent = time.tecnico_dados?.nome || time.tecnico || "--";
    }

    // carrega elenco:
    // ✅ se no JSON já vier elenco, usa
    if (Array.isArray(time.elenco) && time.elenco.length > 0) {
      elencoAtual = time.elenco;
    } else {
      // ✅ SENÃO, busca na API
      // ajuste para o endpoint real do seu backend
      // exemplo: /elenco/<time>
      elencoAtual = await apiGet(`/elenco/${encodeURIComponent(nomeTime)}`);
    }

    if (!Array.isArray(elencoAtual)) {
      throw new Error("Elenco não veio como lista");
    }

    // força média
    const fm = calcForcaMedia(elencoAtual);
    if (forcaMedia) forcaMedia.textContent = fm || "--";

    // qtd elenco
    if (elencoQtd) elencoQtd.textContent = String(elencoAtual.length);

    renderElenco(elencoAtual);
    setMsg("Clube carregado ✅", "ok");
  } catch (err) {
    console.error(err);
    setMsg("Erro ao carregar clube: " + err.message, "erro");
  }
}

// ================================
// EVENTOS
// ================================

if (ligaSelect) {
  ligaSelect.addEventListener("change", async () => {
    const nomeLiga = ligaSelect.value; // ✅ string

    clearTelaClube();

    // sempre reseta times ao trocar liga
    if (timeSelect) {
      timeSelect.innerHTML = `<option value="">Selecione o time</option>`;
    }

    if (!nomeLiga) return;

    await carregarTimesDaLiga(nomeLiga);
  });
}

if (btnCarregarClube) {
  btnCarregarClube.addEventListener("click", async () => {
    const nomeLiga = ligaSelect?.value || "";
    const nomeTime = timeSelect?.value || "";

    await carregarClubeCompleto(nomeLiga, nomeTime);
  });
}

if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    clearTelaClube();

    if (ligaSelect) ligaSelect.value = "";
    if (timeSelect) timeSelect.innerHTML = `<option value="">Selecione o time</option>`;

    setMsg("Tela limpa.", "info");
  });
}

if (inputBusca) {
  inputBusca.addEventListener("input", aplicarFiltroEBusca);
}

// filtros por posição (se existirem)
function ativarFiltro(btn, pos) {
  document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  aplicarFiltroEBusca();
}

if (filtroTodos) {
  filtroTodos.classList.add("filtro");
  filtroTodos.dataset.pos = "Todos";
  filtroTodos.addEventListener("click", () => ativarFiltro(filtroTodos, "Todos"));
}
if (filtroGOL) {
  filtroGOL.classList.add("filtro");
  filtroGOL.dataset.pos = "GOL";
  filtroGOL.addEventListener("click", () => ativarFiltro(filtroGOL, "GOL"));
}
if (filtroDEF) {
  filtroDEF.classList.add("filtro");
  filtroDEF.dataset.pos = "DEF";
  filtroDEF.addEventListener("click", () => ativarFiltro(filtroDEF, "DEF"));
}
if (filtroMEI) {
  filtroMEI.classList.add("filtro");
  filtroMEI.dataset.pos = "MEI";
  filtroMEI.addEventListener("click", () => ativarFiltro(filtroMEI, "MEI"));
}
if (filtroATA) {
  filtroATA.classList.add("filtro");
  filtroATA.dataset.pos = "ATA";
  filtroATA.addEventListener("click", () => ativarFiltro(filtroATA, "ATA"));
}

// confronto (placeholder)
if (btnConfronto) {
  btnConfronto.addEventListener("click", () => {
    alert("Confronto ainda não implementado.");
  });
}

// ================================
// INIT
// ================================
window.addEventListener("load", async () => {
  clearTelaClube();
  await carregarLigas();
});
