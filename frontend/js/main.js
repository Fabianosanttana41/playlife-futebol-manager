import { apiGet } from "./api.js";

// ==============================
// ELEMENTOS
// ==============================
const ligaSelect = document.getElementById("ligaSelect");
const timeSelect = document.getElementById("timeSelect");
const btnCarregarClube = document.getElementById("btnCarregarClube");
const msgErro = document.getElementById("msgErro");

// ==============================
// HELPERS UI
// ==============================
function setErro(msg) {
  msgErro.textContent = msg || "";
}

function limparTimes() {
  timeSelect.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Selecione um time...";
  timeSelect.appendChild(opt);
}

function limparLigas() {
  ligaSelect.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Selecione uma liga...";
  ligaSelect.appendChild(opt);
}

// ==============================
// CARREGAR LIGAS
// ==============================
async function carregarLigas() {
  try {
    setErro("");
    limparLigas();
    limparTimes();

    const data = await apiGet("/ligas");

    // data pode vir:
    // 1) ["Campeonato Brasileiro", "La Liga"...]
    // 2) [{nome:"Campeonato Brasileiro"}, ...]
    // Vamos tratar os dois casos:

    const ligas = Array.isArray(data)
      ? data.map((x) => (typeof x === "string" ? x : x.nome)).filter(Boolean)
      : [];

    ligas.forEach((ligaNome) => {
      const opt = document.createElement("option");

      // ✅ value é SEMPRE string
      opt.value = ligaNome;
      opt.textContent = ligaNome;

      ligaSelect.appendChild(opt);
    });

  } catch (e) {
    setErro("Erro ao carregar ligas: " + e.message);
  }
}

// ==============================
// CARREGAR TIMES DA LIGA
// ==============================
async function carregarTimesDaLiga(ligaNome) {
  try {
    setErro("");
    limparTimes();

    if (!ligaNome) return;

    // ✅ encodeURIComponent garante URL válida
    const times = await apiGet(`/times/${encodeURIComponent(ligaNome)}`);

    // times pode vir:
    // 1) ["Flamengo","Palmeiras"]
    // 2) [{nome:"Flamengo"}]
    const listaTimes = Array.isArray(times)
      ? times.map((t) => (typeof t === "string" ? t : t.nome)).filter(Boolean)
      : [];

    listaTimes.forEach((timeNome) => {
      const opt = document.createElement("option");

      // ✅ value é SEMPRE string
      opt.value = timeNome;
      opt.textContent = timeNome;

      timeSelect.appendChild(opt);
    });

  } catch (e) {
    setErro("Erro ao carregar times: " + e.message);
  }
}

// ==============================
// CLIQUE: CARREGAR CLUBE
// ==============================
async function carregarClube() {
  try {
    setErro("");

    const ligaNome = ligaSelect.value;   // ✅ string
    const timeNome = timeSelect.value;   // ✅ string

    if (!ligaNome) {
      setErro("Selecione uma liga primeiro.");
      return;
    }

    if (!timeNome) {
      setErro("Selecione um time.");
      return;
    }

    // ✅ EXEMPLO chamando seu backend
    // Ajuste para sua rota real:
    //
    // Alguns exemplos possíveis:
    // /clube/<liga>/<time>
    // /elenco/<liga>/<time>
    // /time/<time>
    //
    // Vou assumir que existe:
    // GET /clube/<liga>/<time>

    const clube = await apiGet(
      `/clube/${encodeURIComponent(ligaNome)}/${encodeURIComponent(timeNome)}`
    );

    console.log("CLUBE CARREGADO:", clube);

    // Aqui você chama suas funções de renderização:
    // renderClube(clube);
    // renderElenco(clube.elenco);
    // renderTecnico(clube.tecnico);

  } catch (e) {
    setErro("Falha ao carregar time: " + e.message);
  }
}

// ==============================
// EVENTOS
// ==============================
ligaSelect.addEventListener("change", async () => {
  const ligaNome = ligaSelect.value; // ✅ string
  await carregarTimesDaLiga(ligaNome);
});

btnCarregarClube.addEventListener("click", carregarClube);

// ==============================
// INIT
// ==============================
carregarLigas();
