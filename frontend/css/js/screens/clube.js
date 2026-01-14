window.ClubeScreen = (function(){
  const ligaSelect = document.getElementById("ligaSelect");
  const timeSelect = document.getElementById("timeSelect");
  const btnCarregar = document.getElementById("btnCarregar");
  const btnIrConfronto = document.getElementById("btnIrConfronto");
  const btnIrCampeonato = document.getElementById("btnIrCampeonato");

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

  function setStatus(msg, ok=true){
    statusMsg.textContent = msg;
    statusMsg.style.color = ok ? "#39d353" : "#ff6b6b";
  }

  function limparSelect(sel){ sel.innerHTML=""; }
  function addOption(sel,label,val){
    const op=document.createElement("option");
    op.textContent=label; op.value=val; sel.appendChild(op);
  }

  function calcularForcaMedia(elenco){
    if(!elenco || elenco.length===0) return "0.0";
    const soma=elenco.reduce((a,j)=>a+(j.forca||0),0);
    return (soma/elenco.length).toFixed(1);
  }

  function pathLogo(logoFile){ return `/assets/logos/${logoFile}`; }
  function pathFlag(sigla){
    if(!sigla) return "";
    return `/assets/flags/${sigla.toLowerCase()}.png`;
  }
  function pathKitFromBackend(dadosTime){
    const u = dadosTime?.uniforme_home;
    if(u) return `/assets/kits/${u}`;
    return `/assets/kits/${(dadosTime?.nome||"default").toLowerCase()}.png`;
  }
  function kitFallback(el){
    el.src="";
    el.alt="Sem uniforme";
    el.style.opacity="0.55";
    el.parentElement.style.background="rgba(255,255,255,0.03)";
    el.parentElement.style.border="1px dashed rgba(255,255,255,0.18)";
    el.parentElement.querySelector(".kitHint").textContent="Sem uniforme (adicione PNG)";
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
  function gerarEstilo(j){
    const p=j.posicao;
    if(p==="GOL") return "Muralha / Reflexo";
    if(p==="DEF") return (j.forca>=80?"Zagueiro de elite":"Marcador firme");
    if(p==="MEI") return (j.forca>=82?"Armador":"Meia de ligação");
    if(p==="ATA") return (j.forca>=82?"Finalizador":"Atacante móvel");
    return "Versátil";
  }
  function calcAttr(j){
    const a=j.atributos||{};
    return {
      vel: clamp(a.velocidade ?? j.forca ?? 70, 40, 99),
      fin: clamp(a.finalizacao ?? j.forca ?? 70, 40, 99),
      pas: clamp(a.passe ?? j.forca ?? 70, 40, 99),
      mar: clamp(a.marcacao ?? j.forca ?? 70, 40, 99),
      fis: clamp(a.fisico ?? j.forca ?? 70, 40, 99),
    };
  }
  function aplicarBarra(el,value,color){
    el.style.width = `${value}%`;
    el.style.background = color || "#22c55e";
  }

  // modal
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

  function abrirModalJogador(j){
    modalOverlay.style.display="flex";

    mNome.textContent=j.nome;
    mMeta.textContent=`${window.state.meuTime} • ${window.state.liga}`;
    mForca.textContent=j.forca;
    mPos.textContent=j.posicao;
    mPe.textContent=(j.pe||"—").toUpperCase();

    mIdade.textContent=(j.idade!=null)?`${j.idade} anos`:"—";
    mAltura.textContent=(j.altura!=null)?`${j.altura} m`:"—";

    mLesao.textContent=j.lesao?"Lesionado":"Disponível";
    mEstilo.textContent=gerarEstilo(j);

    mFlag.src=pathFlag(j.nacionalidade||"");
    mFlag.onerror=()=>{ mFlag.style.display="none"; };
    mFlag.style.display="inline-block";

    const attrs=calcAttr(j);
    const cor=(window.state.dadosMeuTime?.cor || "#22c55e");

    tVel.textContent=attrs.vel; aplicarBarra(aVel, attrs.vel, cor);
    tFin.textContent=attrs.fin; aplicarBarra(aFin, attrs.fin, cor);
    tPas.textContent=attrs.pas; aplicarBarra(aPas, attrs.pas, cor);
    tMar.textContent=attrs.mar; aplicarBarra(aMar, attrs.mar, cor);
    tFis.textContent=attrs.fis; aplicarBarra(aFis, attrs.fis, cor);
  }
  function fecharModal(){ modalOverlay.style.display="none"; }

  function ativarBotaoFiltro(pos){
    filtrosPosicao.querySelectorAll("button")
      .forEach(b => b.classList.toggle("active", b.dataset.pos === pos));
  }

  function renderElenco(){
    const dados = window.state.dadosMeuTime;
    if(!dados || !dados.elenco) return;

    const busca=(window.state.busca||"").trim().toLowerCase();
    const pos=window.state.filtroPos;

    let lista=[...dados.elenco];
    if(pos!=="ALL") lista=lista.filter(j=>j.posicao===pos);
    if(busca) lista=lista.filter(j=>(j.nome||"").toLowerCase().includes(busca));

    lista.sort((a,b)=>(b.forca||0)-(a.forca||0));

    contadorJogadores.textContent=`${lista.length} jogador(es)`;
    playersGrid.innerHTML="";

    lista.forEach(j=>{
      const card=document.createElement("div");
      card.className="playerCard";
      const flag=pathFlag((j.nacionalidade||"").toLowerCase());

      card.innerHTML=`
        <div class="pcTop">
          <div style="min-width:0">
            <div class="pcName">${j.nome}</div>
            <div class="pcPos">
              <img class="flag" src="${flag}" onerror="this.style.display='none'" alt="flag"/>
              ${j.posicao} • ${(j.nacionalidade||"—").toUpperCase()}
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
      card.addEventListener("click", ()=>abrirModalJogador(j));
      playersGrid.appendChild(card);
    });

    if(lista.length===0){
      playersGrid.innerHTML=`<div class="muted">Nenhum jogador encontrado.</div>`;
    }
  }

  async function loadLigas(){
    try{
      setStatus("Carregando ligas...");
      const ligas = await window.PlayAPI.ligas();
      limparSelect(ligaSelect);
      ligas.forEach(l=>addOption(ligaSelect,l,l));
      window.state.liga=ligaSelect.value;
      setStatus("Ligas carregadas!");
      await loadTimes();
    }catch(e){
      setStatus("Falha ao carregar ligas: "+e.message,false);
    }
  }

  async function loadTimes(){
    try{
      window.state.liga=ligaSelect.value;
      setStatus("Carregando times...");
      const times=await window.PlayAPI.times(window.state.liga);
      limparSelect(timeSelect);
      times.forEach(t=>addOption(timeSelect,t.nome,t.nome));
      setStatus("Times carregados!");
    }catch(e){
      setStatus("Falha ao carregar times: "+e.message,false);
    }
  }

  async function carregarClube(){
    try{
      const liga=ligaSelect.value;
      const time=timeSelect.value;

      setStatus("Buscando dados do clube...");
      const dados=await window.PlayAPI.time(liga,time);

      window.state.liga=liga;
      window.state.meuTime=time;
      window.state.dadosMeuTime=dados;

      clubeNome.textContent=dados.nome;
      tecnicoNome.textContent=dados.tecnico?.nome || "—";
      forcaMedia.textContent=calcularForcaMedia(dados.elenco);
      totalElenco.textContent=String(dados.elenco?.length||0);

      logoClube.src=pathLogo(dados.logo || "");
      logoClube.onerror=()=>{
        logoClube.src="";
        logoClube.alt="Sem logo";
        logoClube.style.opacity="0.55";
      };
      logoClube.style.opacity="1";

      kitClube.style.opacity="1";
      kitClube.parentElement.style.border="1px solid rgba(255,255,255,0.10)";
      kitClube.parentElement.style.background="rgba(255,255,255,0.04)";
      kitClube.parentElement.querySelector(".kitHint").textContent="Uniforme (home)";
      kitClube.src=pathKitFromBackend(dados);
      kitClube.onerror=()=>kitFallback(kitClube);

      window.state.filtroPos="ALL";
      window.state.busca="";
      buscaJogador.value="";
      ativarBotaoFiltro("ALL");

      setStatus("✅ Clube carregado!");
      renderElenco();
    }catch(e){
      setStatus("Erro ao carregar clube: "+e.message,false);
    }
  }

  function init(){
    ligaSelect.addEventListener("change", loadTimes);
    btnCarregar.addEventListener("click", carregarClube);

    btnIrConfronto.addEventListener("click", window.ConfrontoScreen.open);
    btnIrCampeonato.addEventListener("click", window.CampeonatoScreen.open);

    filtrosPosicao.addEventListener("click", (e)=>{
      const btn=e.target.closest("button");
      if(!btn) return;
      window.state.filtroPos=btn.dataset.pos || "ALL";
      ativarBotaoFiltro(window.state.filtroPos);
      renderElenco();
    });

    buscaJogador.addEventListener("input", ()=>{
      window.state.busca=buscaJogador.value;
      renderElenco();
    });

    btnLimparBusca.addEventListener("click", ()=>{
      buscaJogador.value="";
      window.state.busca="";
      renderElenco();
    });

    btnFecharModal.addEventListener("click", fecharModal);
    modalOverlay.addEventListener("click",(e)=>{ if(e.target===modalOverlay) fecharModal(); });
    window.addEventListener("keydown",(e)=>{ if(e.key==="Escape") fecharModal(); });
  }

  return { init, loadLigas, renderElenco };
})();
