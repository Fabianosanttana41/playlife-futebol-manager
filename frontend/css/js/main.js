window.MainScreen = (function(){
  const btnEntrar = document.getElementById("btnEntrar");

  function init(){
    btnEntrar.addEventListener("click", async () => {
      window.showScreen("clube");
      await window.ClubeScreen.loadLigas();
    });
  }

  return { init };
})();
