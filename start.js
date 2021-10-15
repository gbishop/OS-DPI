import { render } from "uhtml";
import { assemble } from "./components/index";
import { Rules } from "./rules";
import { Data } from "./data";
import { State } from "./state";
import { Designer } from "./components/designer";
import { toDesign } from "./components/base";

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
  let [design, rules, data, _] = await Promise.all([...parts, pageLoaded]);

  if (localStorage.getItem("design")) {
    design = JSON.parse(localStorage.getItem("design"));
  }

  const state = new State("PO6");
  const context = {
    data: new Data(data),
    rules: new Rules(rules, state),
    state,
  };
  const tree = assemble(design, context);

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
  const designerState = new State("D06");
  const designer = new Designer(
    {},
    { state: designerState, rules, data, tree },
    null
  );
  function renderDesigner() {
    localStorage.setItem("design", JSON.stringify(toDesign(tree)));
    render(document.querySelector("div#designer"), designer.template());
    console.log("render designer");
  }
  designerState.observe(debounce(renderDesigner));
  renderDesigner();
}
