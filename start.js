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
import css from "ustyler";

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

/** Generate a new name based on the time
 */
async function newName() {
  const names = await db.names();
  for (let i = 1; i < 100; i++) {
    const name = `new-${i}`;
    if (names.indexOf(name) < 0) return name;
  }
}

/** welcome screen
 */
async function welcome() {
  // clear any values left over
  sessionStorage.clear();
  const names = await db.names();
  render(
    document.body,
    html`
      <div id="welcome">
        <h1>Welcome to the OS-DPI</h1>
        <p>Maybe some explanatory text here?</p>
        <button onclick=${() => db.readDesign()}>Load</button>
        <button onclick=${async () => (window.location.hash = await newName())}>
          New
        </button>
        <h2>Loaded designs:</h2>
        <ul>
          ${names.map(
            (name) => html`<li><a href=${"#" + name}>${name}</a></li>`
          )}
        </ul>
      </div>
    `
  );
}

css`
  #welcome {
    padding: 1em;
  }
`;

/** Load page and data then go
 */
export async function start() {
  const name = window.location.hash.slice(1);
  logInit(name);
  log("start", name);
  if (!name) {
    return welcome();
  }
  db.setDesignName(name);
  const emptyPage = {
    type: "page",
    props: {},
    children: [],
  };
  const layout = await db.read("layout", emptyPage);
  const rulesArray = await db.read("actions", []);
  const dataArray = await db.read("content", []);
  await pageLoaded;

  const state = new State(`UIState`);
  const rules = new Rules(rulesArray, state);
  const data = new Data(dataArray);
  /** @type {Context} */
  // @ts-ignore
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

  /* Designer */
  state.define("editing", false);
  const designer = new Designer({}, context, null);

  /* ToolBar */
  const toolbar = new ToolBar({}, context, null);

  /* Monitor */
  const monitor = new Monitor({}, context, null);

  function renderUI() {
    let IDE = html``;
    if (state.get("editing")) {
      IDE = html`
        <div id="designer">${designer.template()}</div>
        <div id="monitor">${monitor.template()}</div>
        <div id="toolbar">${toolbar.template()}</div>
      `;
    }
    document.body.classList.toggle("designing", state.get("editing"));
    safeRender(
      document.body,
      html`<div id="UI">${tree.template()}</div>
        ${IDE}`
    );
    log("render UI");
  }
  state.observe(debounce(renderUI));
  renderUI();

  /* Watch for updates happening in other tabs */
  const channel = new BroadcastChannel("os-dpi");
  /** @param {MessageEvent} event */
  channel.onmessage = (event) => {
    console.log("got broadcast", event);
    const message = /** @type {UpdateNotification} */ (event.data);
    if (db.designName == message.name) {
      if (message.action == "update") {
        start();
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
        state.update({ editing: !state.get("editing") });
      }
    }
  });
}

window.addEventListener("hashchange", start);

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

start();
