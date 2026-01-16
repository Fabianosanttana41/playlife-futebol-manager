// ==========================================================
// Playlife - main.js (PRODUÇÃO) - Cloudflare Pages + Render API
// ==========================================================

import { apiGet } from "./api.js";

// =============== SCREENS ===============
const screenMain = document.getElementById("screenMain");
const screenClube = document.getElementById("screenClube");
const screenConfronto = document.getElementById("screenConfronto");

function showScreen(name) {
  screenMain.style.display = (name === "main") ? "flex" : "none";
  screenClube.style.display = (name === "clube") ? "block" : "none";
  screenConfronto.style.display = (name === "confronto") ? "block" : "none";
}

// =============== ELEMENTOS CLUBE ===============
const btnEntrar = document.getElementById("btnEntrar");
const ligaSelect = document.getElementById("ligaSelect");
const timeSelect = document.getElementById("timeSelect");
const btnCarregar = document.getElementById("btnCarregar");
const btnIrConfronto = document.getElementById("btnIrConfronto");

const statusMsg = document.getElementById("statusMsg");

const clubeNome = document.getElementById("clubeNome");
const tecnicoNome = document.getElementById("tecnicoNome");
const forcaMedia = document.getElementById("forcaMedia");
const totalElenco = document.getElementById("totalElenco");
const logoClube = document.getElementById("logoClube");
const kitClube = document.getElementById("kitClube");

const buscaJogador = document.getElementById("buscaJogador");
const btnLimparBusca = document.getElementById("btnLimparBusca");
const playersGrid = document.getElementById("playersGrid");
const contadorJogadores = document.getElementById("contadorJogadores");
const filtrosPosicao = document.getElementById("filtrosPosicao");

// =============== ELEMENTOS CONFRONTO (telinha) ===============
const btnVoltarClube = document.getElementById("btnVoltarClube");
const confrontoLiga = document.getElementById("confrontoLiga");
const confrontoAdvTime = document.getElementById("confrontoAdvTime");
const btnIniciarLive = document.getElementById("btnIniciarLive");

const logoMandante = document.getElementById("logoMandante");
const logoVisitante = document.getElementById("logoVisitante");
const nomeMandante = document.getElementById("nomeMandante");
const nomeVisitante = document.getElementById("nomeVisitante");

const lineupMandante = document.getElementById("lineupMandante");
const lineupVisitante = document.getElementById("lineupVisitante");
const lineupTitleM = document.getElementById("lineupTitleM");
const lineupTitleV = document.getElementById("lineupTitleV");

const pitchMandante = document.getElementById("pitchMandante");
const pitchVisitante = document.getElementById("pitchVisitante");
const halfTopTitle = document.getElementById("halfTopTitle");
const halfBottomTitle = document.getElementById("halfBottomTitle");

// =============== MODAL ATLETA ===============
const modalOverlay = document.getElementById("modalOverlay");
const btnFecharModal = document.getElementById("btnFecharModal");

const mNome = document.getElementById("mNome");
const mMeta = document.getElementById("mMeta");
const mForca = document.getElementById("mForca");
const mPos = document.getElementById("mPos");
const mPe = document.getElementById("mPe");
const mIdade = document.getElementById("mIdade");
const mAltura = document.getElementById("mAltura");
const mLesao = document.getElementById("mLesao");
const mEstilo = document.getElementById("mEstilo");
const mFlag = document.getElementById("mFlag");

const aVel = document.getElementById("aVel");
const aFin = document.getElementById("aFin");
const aPas = document.getElementById("aPas");
const aMar = document.getElementById("aMar");
const aFis = document.getElementById("aFis");

const tVel = document.getElementById("tVel");
const tFin = document.getElementById("tFin");
const tPas = document.getElementById("tPas");
const tMar = document.getElementById("tMar");
const tFis = document.getElementById("tFis");

// =============== ESTADO GLOBAL ===============
let estado = {
  liga: null,
  meuTime: null,
  dadosMeuTime: null,
  filtroPos: "ALL",
  busca: "",
};

// =============== HELPERS UI ===============
function setStatus(msg, ok = true) {
  statusMsg.textContent = msg;
  statusMsg.style.color = ok ? "#39d353" : "#ff6b6b";
}

function limparSelect(sel) {
  sel.innerHTML = "";
}

function addOption(sel, label, value) {
  const op = document.createElement("option");
  op.textContent = label;
  op.value = value;
  sel.appendChild(op);
}

function placeholderSelect(sel, text = "Selecione...") {
  limparSelect(sel);
  const op0 = document.createElement("option");
  op0.value = "";
  op0.textContent = text;
  op0.disabled = true;
  op0.selected = true;
  sel.appendChild(op0);
}

// ✅ CORREÇÃO PRINCIPAL AQUI:
// garante que o select salva somente STRING e nunca Object/undefined
function preencherSelectLigas(ligas) {
  placeholderSelect(ligaSelect, "Selecione a liga");

  (ligas || []).forEach((ligaNome) => {
    const ligaTxt = String(ligaNome); // ✅ força string
    const op = document.createElement("option");
    op.value = ligaTxt;              // ✅ value string
    op.textContent = ligaTxt;        // ✅ label string
    ligaSelect.appendChild(op);
  });
}

function preencherSelectTimes(times) {
  placeholderSelect(timeSelect, "Selecione o time");

  (times || []).forEach((t) => {
    // backend retorna lista de objetos {nome: "..."} OU lista de strings
    const nome = typeof t === "string" ? t : t?.nome;
    if (!nome) return;

    const txt = String(nome);
    addOption(timeSelect, txt, txt); // ✅ value string
  });
}

function calcularForcaMedia(elenco) {
  if (!elenco || elenco.length === 0) return "0.0";
  const soma = elenco.reduce((a, j) => a + (j.forca || 0), 0);
  return (soma / elenco.length).toFixed(1);
}

// assets
function pathLogo(logoFile) {
  return `./assets/logos/${logoFile}`;
}
function pathFlag(sigla) {
  return `./assets/flags/${(sigla || "").toLowerCase()}.png`;
}
function pathKitFromBackend(dadosTime) {
  const u = dadosTime?.uniforme_home;
  if (u) return `./assets/kits/${u}`;
  return `./assets/kits/${(dadosTime?.nome || "default").toLowerCase()}.png`;
}

function kitFallback(el) {
  el.src = "";
  el.alt = "Sem uniforme";
  el.style.opacity = "0.55";
  el.parentElement.style.background = "rgba(255,255,255,0.03)";
  el.parentElement.style.border = "1px dashed rgba(255,255,255,0.18)";
  const hint = el.parentElement.querySelector(".kitHint");
  if (hint) hint.textContent = "Sem uniforme (adicione PNG)";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function gerarEstilo(j) {
  const p = j.posicao;
  if (p === "GOL") return "Muralha / Reflexo";
  if (p === "DEF") return (j.forca >= 80 ? "Zagueiro de elite" : "Marcador firme");
  if (p === "MEI") return (j.forca >= 82 ? "Armador" : "Meia de ligação");
  if (p === "ATA") return (j.forca >= 82 ? "Finalizador" : "Atacante móvel");
  return "Versátil";
}

function calcAttr(j) {
  const a = j.atributos || {};
  return {
    vel: clamp(a.velocidade ?? j.forca ?? 70, 40, 99),
    fin: clamp(a.finalizacao ?? j.forca ?? 70, 40, 99),
    pas: clamp(a.passe ?? j.forca ?? 70, 40, 99),
    mar: clamp(a.marcacao ?? j.forca ?? 70, 40, 99),
    fis: clamp(a.fisico ?? j.forca ?? 70, 40, 99),
  };
}

function aplicarBarra(el, value, color) {
  el.style.width = `${value}%`;
  el.style.background = color || "#22c55e";
}

// =============== API CALLS ===============
async function carregarLigas() {
  try {
    setStatus("Carregando ligas...");

    const ligas = await apiGet("/ligas");

    preencherSelectLigas(ligas);

    estado.liga = null;
    estado.meuTime = null;
    estado.dadosMeuTime = null;

    placeholderSelect(timeSelect, "Selecione o time");

    setStatus("✅ Ligas carregadas! Selecione uma liga.");
  } catch (e) {
    setStatus("Falha ao carregar ligas: " + e.message, false);
  }
}

async function carregarTimesDaLiga(liga) {
  try {
    if (!liga) return;

    setStatus("Carregando times...");

    // ✅ liga sempre string agora!
    const times = await apiGet(`/times/${encodeURIComponent(liga)}`);

    preencherSelectTimes(times);

    setStatus("✅ Times carregados! Selecione um time.");
  } catch (e) {
    setStatus("Falha ao carregar times: " + e.message, false);
  }
}

async function carregarClube() {
  try {
    const liga = ligaSelect.value;
    const time = timeSelect.value;

    if (!liga) {
      setStatus("Selecione uma liga!", false);
      return;
    }
    if (!time) {
      setStatus("Selecione um time!", false);
      return;
    }

    setStatus("Buscando dados do clube...");

    const dados = await apiGet(
      `/time/${encodeURIComponent(liga)}/${encodeURIComponent(time)}`
    );

    estado.liga = liga;
    estado.meuTime = time;
    estado.dadosMeuTime = dados;

    clubeNome.textContent = dados.nome || "—";
    tecnicoNome.textContent = dados.tecnico?.nome || "—";
    forcaMedia.textContent = calcularForcaMedia(dados.elenco);
    totalElenco.textContent = String(dados.elenco?.length || 0);

    // logo
    logoClube.style.opacity = "1";
    logoClube.src = pathLogo(dados.logo || "");
    logoClube.onerror = () => {
      logoClube.src = "";
      logoClube.alt = "Sem logo";
      logoClube.style.opacity = "0.55";
    };

    // kit
    kitClube.style.opacity = "1";
    kitClube.parentElement.style.border = "1px solid rgba(255,255,255,0.10)";
    kitClube.parentElement.style.background = "rgba(255,255,255,0.04)";
    const hint = kitClube.parentElement.querySelector(".kitHint");
    if (hint) hint.textContent = "Uniforme (home)";
    kitClube.src = pathKitFromBackend(dados);
    kitClube.onerror = () => kitFallback(kitClube);

    estado.filtroPos = "ALL";
    estado.busca = "";
    buscaJogador.value = "";
    ativarBotaoFiltro("ALL");

    setStatus("✅ Clube carregado!");
    renderElenco();
  } catch (e) {
    setStatus("Erro ao carregar clube: " + e.message, false);
  }
}

// =============== FILTROS / ELENCO ===============
function ativarBotaoFiltro(pos) {
  const botoes = filtrosPosicao.querySelectorAll("button");
  botoes.forEach((b) => b.classList.toggle("active", b.dataset.pos === pos));
}

function renderElenco() {
  const dados = estado.dadosMeuTime;
  if (!dados || !dados.elenco) {
    contadorJogadores.textContent = "0 jogadores";
    playersGrid.innerHTML = `<div class="muted">Nenhum elenco carregado.</div>`;
    return;
  }

  const busca = (estado.busca || "").trim().toLowerCase();
  const pos = estado.filtroPos;

  let lista = [...dados.elenco];

  if (pos !== "ALL") lista = lista.filter((j) => j.posicao === pos);
  if (busca.length > 0) lista = lista.filter((j) => (j.nome || "").toLowerCase().includes(busca));

  lista.sort((a, b) => (b.forca || 0) - (a.forca || 0));

  contadorJogadores.textContent = `${lista.length} jogador(es)`;
  playersGrid.innerHTML = "";

  lista.forEach((j) => {
    const card = document.createElement("div");
    card.className = "playerCard";

    const flag = pathFlag(j.nacionalidade || "");
    card.innerHTML = `
      <div class="pcTop">
        <div style="min-width:0">
          <div class="pcName">${j.nome}</div>
          <div class="pcPos">
            <img class="flag" src="${flag}" onerror="this.style.display='none'" alt="flag"/>
            ${j.posicao} • ${(j.nacionalidade || "—").toUpperCase()}
          </div>
        </div>
        <div class="pcForce">${j.forca}</div>
      </div>
      <div class="pcFooter">
        <div class="tag">${gerarEstilo(j)}</div>
        <div class="tag" style="${j.lesao ? "border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.10)" : ""}">
          ${j.lesao ? "🤕 Lesão" : "✅ Ok"}
        </div>
      </div>
    `;

    card.addEventListener("click", () => abrirModalJogador(j));
    playersGrid.appendChild(card);
  });

  if (lista.length === 0) {
    playersGrid.innerHTML = `<div class="muted">Nenhum jogador encontrado.</div>`;
  }
}

// =============== MODAL ===============
function abrirModalJogador(j) {
  modalOverlay.style.display = "flex";

  mNome.textContent = j.nome;
  mMeta.textContent = `${estado.meuTime || "—"} • ${estado.liga || "—"}`;
  mForca.textContent = j.forca ?? "—";
  mPos.textContent = j.posicao ?? "—";
  mPe.textContent = (j.pe || "—").toUpperCase();

  mIdade.textContent = (j.idade != null) ? `${j.idade} anos` : "—";
  mAltura.textContent = (j.altura != null) ? `${j.altura} m` : "—";

  mLesao.textContent = j.lesao ? "Lesionado" : "Disponível";
  mEstilo.textContent = gerarEstilo(j);

  mFlag.src = pathFlag(j.nacionalidade || "");
  mFlag.onerror = () => { mFlag.style.display = "none"; };
  mFlag.style.display = "inline-block";

  const attrs = calcAttr(j);
  const cor = (estado.dadosMeuTime?.cor || "#22c55e");

  tVel.textContent = attrs.vel; aplicarBarra(aVel, attrs.vel, cor);
  tFin.textContent = attrs.fin; aplicarBarra(aFin, attrs.fin, cor);
  tPas.textContent = attrs.pas; aplicarBarra(aPas, attrs.pas, cor);
  tMar.textContent = attrs.mar; aplicarBarra(aMar, attrs.mar, cor);
  tFis.textContent = attrs.fis; aplicarBarra(aFis, attrs.fis, cor);
}

function fecharModal() {
  modalOverlay.style.display = "none";
}

btnFecharModal.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) fecharModal(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharModal(); });

// =============== CONFRONTO (TELA) ===============
async function abrirConfronto() {
  if (!estado.liga || !estado.meuTime || !estado.dadosMeuTime) {
    alert("Carregue um clube primeiro!");
    return;
  }

  showScreen("confronto");
  confrontoLiga.textContent = estado.liga;

  try {
    const times = await apiGet(`/times/${encodeURIComponent(estado.liga)}`);
    limparSelect(confrontoAdvTime);

    (times || [])
      .map(t => typeof t === "string" ? { nome: t } : t)
      .filter(t => t?.nome && t.nome !== estado.meuTime)
      .forEach(t => addOption(confrontoAdvTime, String(t.nome), String(t.nome)));
  } catch (e) {
    alert("Erro ao carregar adversários: " + e.message);
  }

  // reset básico
  document.getElementById("placarLive").textContent = "0 x 0";
  document.getElementById("clockLive").textContent = "00:00 • 1º tempo";
  document.getElementById("sumulaBox").innerHTML = `<div class="muted">Aguardando início da partida...</div>`;

  lineupMandante.innerHTML = "";
  lineupVisitante.innerHTML = "";
  pitchMandante.innerHTML = "";
  pitchVisitante.innerHTML = "";
}

function voltarClube() {
  showScreen("clube");
}

function renderLineup(container, arr) {
  container.innerHTML = "";
  (arr || []).forEach(j => {
    const div = document.createElement("div");
    div.className = "li";
    div.textContent = `${j.nome} (${j.posicao}) • ${j.forca}`;
    container.appendChild(div);
  });
}

function renderPitch(container, arr) {
  container.innerHTML = "";
  (arr || []).forEach(j => {
    const d = document.createElement("div");
    d.className = "dot";
    d.title = j.nome;
    d.textContent = j.nome;
    container.appendChild(d);
  });
}

function escolherTitulares(elenco) {
  const disp = (elenco || []).filter(j => !j.lesao);
  disp.sort((a, b) => (b.forca || 0) - (a.forca || 0));
  return disp.slice(0, 11);
}

async function carregarConfronto() {
  if (!estado.dadosMeuTime) return;

  const adv = confrontoAdvTime.value;
  if (!adv) {
    alert("Selecione um adversário!");
    return;
  }

  btnIniciarLive.disabled = true;
  btnIniciarLive.textContent = "Carregando...";

  try {
    const liga = estado.liga;
    const visitante = await apiGet(`/time/${encodeURIComponent(liga)}/${encodeURIComponent(adv)}`);

    const m = estado.dadosMeuTime;
    const v = visitante;

    nomeMandante.textContent = m.nome;
    nomeVisitante.textContent = v.nome;

    logoMandante.style.display = "block";
    logoVisitante.style.display = "block";
    logoMandante.src = pathLogo(m.logo || "");
    logoVisitante.src = pathLogo(v.logo || "");
    logoMandante.onerror = () => logoMandante.style.display = "none";
    logoVisitante.onerror = () => logoVisitante.style.display = "none";

    halfTopTitle.textContent = m.nome;
    halfBottomTitle.textContent = v.nome;

    lineupTitleM.textContent = m.nome;
    lineupTitleV.textContent = v.nome;

    const titM = escolherTitulares(m.elenco);
    const titV = escolherTitulares(v.elenco);

    renderLineup(lineupMandante, titM);
    renderLineup(lineupVisitante, titV);

    renderPitch(pitchMandante, titM);
    renderPitch(pitchVisitante, titV);

    document.getElementById("sumulaBox").innerHTML = `<div class="muted">Confronto carregado. Escolha tática e inicie!</div>`;
  } catch (e) {
    alert("Erro ao carregar confronto: " + e.message);
  } finally {
    btnIniciarLive.disabled = false;
    btnIniciarLive.textContent = "Carregar confronto";
  }
}

// =============== EVENTOS ===============
btnEntrar.addEventListener("click", async () => {
  showScreen("clube");
  await carregarLigas();
});

ligaSelect.addEventListener("change", async () => {
  const liga = ligaSelect.value; // ✅ string garantida
  estado.liga = liga;

  // sempre resetar times
  estado.meuTime = null;
  estado.dadosMeuTime = null;
  placeholderSelect(timeSelect, "Selecione o time");

  await carregarTimesDaLiga(liga);
});

timeSelect.addEventListener("change", () => {
  estado.meuTime = timeSelect.value || null;
});

btnCarregar.addEventListener("click", carregarClube);

btnIrConfronto.addEventListener("click", abrirConfronto);
btnVoltarClube.addEventListener("click", voltarClube);
btnIniciarLive.addEventListener("click", carregarConfronto);

filtrosPosicao.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  estado.filtroPos = btn.dataset.pos || "ALL";
  ativarBotaoFiltro(estado.filtroPos);
  renderElenco();
});

buscaJogador.addEventListener("input", () => {
  estado.busca = buscaJogador.value;
  renderElenco();
});

btnLimparBusca.addEventListener("click", () => {
  buscaJogador.value = "";
  estado.busca = "";
  renderElenco();
});

// =============== START ===============
showScreen("main");
