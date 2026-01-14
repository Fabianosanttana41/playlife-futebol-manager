(function(){
  window.showScreen("main");

  window.MainScreen.init();
  window.ClubeScreen.init();
  window.ConfrontoScreen.init();
  window.CampeonatoScreen.init();

  // tenta recarregar carreira salva
  const cid = window.Storage.loadCareer();
  if(cid){
    window.state.carreira_id = cid;
  }
})();
