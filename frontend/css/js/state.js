window.state = {
  liga: null,
  meuTime: null,
  dadosMeuTime: null,

  filtroPos: "ALL",
  busca: "",

  carreira_id: null,
  rodada_ctx: null, // dados da rodada iniciada

  live: {
    match_id: null,
    running: false,
    tickTimer: null,
    segundo: 0,
    tempoTotal: 90
  }
};

window.Storage = {
  saveCareer(id){
    localStorage.setItem("playlife_carreira_id", String(id));
  },
  loadCareer(){
    const v = localStorage.getItem("playlife_carreira_id");
    return v ? Number(v) : null;
  },
  clearCareer(){
    localStorage.removeItem("playlife_carreira_id");
  }
};
