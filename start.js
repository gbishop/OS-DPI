import { render, html } from "uhtml";
import { assemble } from "./components/index";
import { Rules } from "./rules";
import { Data } from "./data";
import { State } from "./state";
import { Designer } from "./components/designer";
import { Monitor } from "./components/monitor";
import { ToolBar } from "./components/toolbar";
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

/** welcome screen
 */
async function welcome() {
  const names = await db.names();
  render(
    document.getElementById("UI"),
    html`
      <h1>Welcome to the OS-DPI</h1>
      <p>Maybe some explanatory text here?</p>
      <button onclick=${() => db.readDesign()}>Open</button>
      <ul>
        ${names.map((name) => html`<li><a href=${"#" + name}>${name}</a></li>`)}
      </ul>
    `
  );
}

/** Load data and page then go
 * @param {string} name
 */
export async function start(name) {
  logInit(name);
  log("start", name);
  if (!name) {
    return welcome();
  }
  db.setDesignName(name);
  const layout = await db.read("layout", {
    type: "page",
    props: {},
    children: [],
  });
  const rulesArray = await db.read("actions", []);
  const dataArray = await db.read("content", []);
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

  /* ToolBar */
  const toolbar = new ToolBar(
    {},
    { state: designerState, rules, data, tree },
    null
  );
  function renderToolBar() {
    log("render ToolBar");
    if (!document.body.classList.contains("designing")) return;
    const TI = document.querySelector("div#toolbar");
    if (TI) safeRender(TI, toolbar.template());
  }
  designerState.observe(debounce(renderToolBar));
  renderToolBar();

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

  /* Watch for updates happening in other tabs */
  const channel = new BroadcastChannel("os-dpi");
  /** @param {MessageEvent} event */
  channel.onmessage = (event) => {
    console.log("got broadcast", event);
    const message = /** @type {UpdateNotification} */ (event.data);
    if (db.designName == message.name) {
      if (message.action == "update") {
        window.location.reload();
      } else if (message.action == "rename") {
        window.location.hash = message.newName;
      }
    }
  };
  db.addUpdateListener((message) => {
    console.log("posting", name);
    channel.postMessage(message);
  });

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

window.addEventListener("hashchange", () => window.location.reload());

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
