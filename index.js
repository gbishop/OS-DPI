import "./components";

// fade in to avoid the FOUC
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});
window.addEventListener("unload", () => console.log("unload"));
