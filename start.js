import { render } from "uhtml";
import { assemble } from "./components/index";
import { Rules } from "./rules";
import { Data } from "./data";
import { State } from "./state";
import { Designer } from "./components/designer";
import { Monitor } from "./components/monitor";
import db from "./db";
import { log, logInit } from "./log";

const safe = true;

/** @param {Element} where
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

/** let me wait for the page to load */
const pageLoaded = new Promise((resolve) => {
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    resolve(true);
  });
});

/** Load data and page then go
 * @param {string} name
 */
export async function start(name) {
  logInit(name);
  log("start");
  const layout = await db.read(name, "layout", {
    type: "page",
    props: {},
    children: [],
  });
  const rulesArray = await db.read(name, "actions", []);
  const dataArray = await db.read(name, "content", []);
  await pageLoaded;

  const state = new State(`UIState`);
  const rules = new Rules(rulesArray, state);
  const data = new Data(dataArray);
  const context = {
    data,
    rules,
    state,
  };
  // @ts-ignore
  const tree = assemble(layout, context);
  context.tree = tree;

  /** @param {() => void} f */
  function debounce(f) {
    let timeout = null;
    return () => {
      if (timeout) window.cancelAnimationFrame(timeout);
      timeout = window.requestAnimationFrame(f);
    };
  }

  function renderUI() {
    const UI = document.querySelector("#UI");
    if (UI) safeRender(UI, tree.template());
    log("render UI");
  }
  state.observe(debounce(renderUI));
  renderUI();

  /* Designer */
  const designerState = new State(`DIState`);
  designerState.update({ name });
  const designer = new Designer(
    {},
    { state: designerState, rules, data, tree },
    null
  );
  function renderDesigner() {
    if (!document.body.classList.contains("designing")) return;
    log("render designer");
    const DI = document.querySelector("div#designer");
    if (DI) safeRender(DI, designer.template());
    log("render designer");
  }
  designerState.observe(debounce(renderDesigner));
  renderDesigner();

  /* Monitor */
  const monitor = new Monitor({}, { state, rules, data, tree }, null);
  function renderMonitor() {
    log("render monitor");
    if (!document.body.classList.contains("designing")) return;
    const MI = document.querySelector("div#monitor");
    if (MI) safeRender(MI, monitor.template());
  }
  state.observe(debounce(renderMonitor));
  renderMonitor();

  /** @param {KeyboardEvent} event */
  document.addEventListener("keydown", (event) => {
    if (event.key == "d") {
      const target = /** @type {HTMLElement} */ (event.target);
      if (target && target.tagName != "INPUT" && target.tagName != "TEXTAREA") {
        event.preventDefault();
        event.stopPropagation();
        document.body.classList.toggle("designing");
        state.update();
      }
    }
  });
}

/** @typedef {PointerEvent & { target: HTMLElement }} ClickEvent */
document.addEventListener("click", (/** @type {ClickEvent} */ event) => {
  const target = event.target;
  let text = "";
  for (let n = target; n.parentElement && !text; n = n.parentElement) {
    text = n.textContent || "";
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
