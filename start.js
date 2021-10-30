import { render } from "uhtml";
import { assemble } from "./components/index";
import { Rules } from "./rules";
import { Data } from "./data";
import { State } from "./state";
import { Designer } from "./components/designer";
import { toDesign } from "./components/base";
import { initSpeech } from "./components/speech";
import { Monitor } from "./components/monitor";

const safe = true;

/** @param {HTMLElement} where
 * @param {Hole} what
 */
function safeRender(where, what) {
  let r;
  if (safe) {
    try {
      r = render(where, what);
    } catch (error) {
      log("crash", error);
      const id = where.id;
      const div = document.createElement("div");
      r = render(div, what);
      where.id = "";
      div.id = id;
      where.replaceWith(div);
    }
  } else {
    r = render(where, what);
  }
  return r;
}

import { log, logInit } from "./log";

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
  logInit(name);
  log("start");
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
    return f;
    /*
     * maybe debounce is causing problems?
    let timeout = null;
    return () => {
      if (timeout) window.cancelAnimationFrame(timeout);
      timeout = window.requestAnimationFrame(f);
    };
    */
  }

  function renderUI() {
    safeRender(document.querySelector("#UI"), tree.template());
    log("render UI");
  }
  state.observe(debounce(renderUI));
  renderUI();

  /* Designer */
  const designerState = new State(`DIState-${name}`);
  const designer = new Designer(
    {},
    { state: designerState, rules, data, tree },
    null
  );
  function renderDesigner() {
    if (!document.body.classList.contains("designing")) return;
    log("render designer");
    safeRender(document.querySelector("div#designer"), designer.template());
    localStorage.setItem(
      `design-${name}`,
      JSON.stringify({
        layout: toDesign(tree),
        rulesArray: rules.rules,
      })
    );
    log("render designer");
  }
  designerState.observe(debounce(renderDesigner));
  renderDesigner();

  /* Monitor */
  const monitor = new Monitor({}, { state, rules, data, tree }, null);
  function renderMonitor() {
    if (!document.body.classList.contains("designing")) return;
    safeRender(document.querySelector("div#monitor"), monitor.template());
  }
  state.observe(debounce(renderMonitor));
  renderMonitor();

  document.addEventListener("keydown", (event) => {
    if (event.key == "D" && event.altKey) {
      event.preventDefault();
      document.body.classList.toggle("designing");
      state.update();
    }
  });
  log("here");
}

/** @typedef {PointerEvent & { target: HTMLElement }} ClickEvent */
document.addEventListener("click", (/** @type {ClickEvent} */ event) => {
  const target = event.target;
  let text = "";
  for (let n = target; n.parentElement && !text; n = n.parentElement) {
    text = n.textContent;
  }
  let id = "none";
  if (target instanceof HTMLButtonElement && target.dataset.id) {
    id = target.dataset.id;
  } else {
    const div = target.closest('div[id^="osdpi"]');
    if (div) {
      id = div.id;
    }
  }
  log("click", target.tagName, id, text.slice(0, 30));
});
