window.screens = {
  main: document.getElementById("screenMain"),
  clube: document.getElementById("screenClube"),
  confronto: document.getElementById("screenConfronto"),
  campeonato: document.getElementById("screenCampeonato"),
};

window.showScreen = function(name){
  Object.keys(window.screens).forEach(k => {
    window.screens[k].style.display = (k === name)
      ? (k === "main" ? "flex" : "block")
      : "none";
  });
};
