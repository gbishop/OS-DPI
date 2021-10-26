import { render } from "uhtml";
import { assemble } from "./components/index";
import { Rules } from "./rules";
import { Data } from "./data";
import { State } from "./state";
import { Designer } from "./components/designer";
import { toDesign } from "./components/base";
import { initSpeech } from "./components/speech";

/** let me wait for the page to load */
const pageLoaded = new Promise((resolve) => {
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    resolve();
  });
});

/** Load data and page then go
 * @param {string} name
 */
export async function start(name) {
  const parts = ["design.json", "rules.json", "data.json"].map(async (file) => {
    const resp = await fetch(`./examples/${name}/${file}`);
    return await resp.json();
  });
  let [layout, rulesArray, dataArray, _] = await Promise.all([
    ...parts,
    pageLoaded,
  ]);

  if (localStorage.getItem(`design-${name}`)) {
    const design = JSON.parse(localStorage.getItem(`design-${name}`));
    layout = design.layout;
    rulesArray = design.rulesArray;
  }

  const state = new State(`UIState-${name}`);
  const rules = new Rules(rulesArray, state);
  const data = new Data(dataArray);
  const context = {
    data,
    rules,
    state,
  };
  await initSpeech(state);
  const tree = assemble(layout, context);

  /** @param {() => void} f */
  function debounce(f) {
    let timeout = null;
    return () => {
      if (timeout) window.cancelAnimationFrame(timeout);
      timeout = window.requestAnimationFrame(f);
    };
  }

  function renderUI() {
    render(document.querySelector("#UI"), tree.template());
    console.log("render UI");
  }
  state.observe(debounce(renderUI));
  renderUI();
  const designerState = new State(`DIState-${name}`);
  const designer = new Designer(
    {},
    { state: designerState, rules, data, tree },
    null
  );
  function renderDesigner() {
    if (!document.body.classList.contains("designing")) return;
    localStorage.setItem(
      `design-${name}`,
      JSON.stringify({
        layout: toDesign(tree),
        rulesArray: rules.rules,
      })
    );
    render(document.querySelector("div#designer"), designer.template());
    console.log("render designer");
  }
  designerState.observe(debounce(renderDesigner));
  renderDesigner();

  console.log("here");
  document.addEventListener("keydown", (event) => {
    console.log(event);
    if (event.key == "D" && event.altKey) {
      event.preventDefault();
      console.log("toggle");
      document.body.classList.toggle("designing");
      state.update();
    }
  });
}
