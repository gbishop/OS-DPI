import { html } from "uhtml";
import { Data } from "./data";
import { State } from "./state";
import { TreeBase } from "./components/treebase";
import "./components";
import { Page } from "./components/page";
import { Monitor } from "./components/monitor";
import { ToolBar } from "./components/toolbar";
import db from "./db";
import pleaseWait from "./components/wait";
import "css/designer.css";
import "css/colors.css";
import { ButtonWrap, clearAccessChanged } from "./components/access";
import Globals from "./globals";
import { PatternList } from "./components/access/pattern";
import { MethodChooser } from "./components/access/method";
import { CueList } from "./components/access/cues";
import { Actions } from "./components/actions";
import { welcome } from "./components/welcome";
import { callAfterRender, safeRender } from "./render";

/** let me wait for the page to load */
const pageLoaded = new Promise((resolve) => {
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    resolve(true);
  });
});

/** Load page and data then go
 */
export async function start() {
  if (window.location.search && !window.location.hash.slice(1)) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fetch")) {
      await pleaseWait(db.readDesignFromURL(params.get("fetch")));
      window.history.replaceState(
        {},
        document.title,
        window.location.origin + window.location.pathname + "#" + db.designName
      );
    }
  }
  const name = window.location.hash.slice(1);
  if (!name) {
    return welcome();
  }
  db.setDesignName(name);
  const dataArray = await db.read("content", []);
  await pageLoaded;

  Globals.tree = await Page.load();
  Globals.state = new State(`UIState`);
  Globals.actions = await Actions.load();
  Globals.data = new Data(dataArray);
  Globals.cues = await CueList.load();
  Globals.patterns = await PatternList.load();
  Globals.method = await MethodChooser.load();
  Globals.restart = start;

  /** @param {() => void} f */
  function debounce(f) {
    let timeout = null;
    return () => {
      if (timeout) window.cancelAnimationFrame(timeout);
      timeout = window.requestAnimationFrame(f);
    };
  }

  /* Designer */
  Globals.state.define("editing", true); // for now
  Globals.designer = TreeBase.fromObject({
    className: "DesignerTabControl",
    props: { tabEdge: "top", stateName: "designerTab" },
    children: [
      {
        className: "Layout",
        props: { name: "Layout" },
        children: [Globals.tree],
      },
      Globals.actions,
      Globals.cues,
      Globals.patterns,
      Globals.method,
      {
        className: "Content",
        props: {},
        children: [],
      },
      {
        className: "Logging",
        props: {},
        children: [],
      },
    ],
  });

  /* ToolBar */
  const toolbar = ToolBar.create("ToolBar", null);

  /* Monitor */
  const monitor = Monitor.create("Monitor", null);

  function renderUI() {
    const startTime = performance.now();
    let IDE = html`<!--empty-->`;
    if (Globals.state.get("editing")) {
      IDE = html`
        ${toolbar.template()}
        <div
          id="designer"
          onclick=${(/** @type {InputEventWithTarget} */ event) => {
            const button = ButtonWrap(event.target);
            if (button.access && "onClick" in button.access) {
              button.access.onClick(event);
            }
          }}
        >
          ${Globals.designer.template()}
        </div>
        <div id="monitor">${monitor.template()}</div>
      `;
    }
    document.body.classList.toggle("designing", Globals.state.get("editing"));
    // clear the changed flag, TODO there must be a better way!
    clearAccessChanged();
    safeRender(
      document.body,
      html`<div id="UI">
          <div id="timer"></div>
          ${Globals.cues.renderCss()}${Globals.tree.template()}
        </div>
        ${IDE}`
    );
    Globals.method.refresh();
    if (location.host.startsWith("localhost")) {
      document.getElementById("timer").innerText = (
        performance.now() - startTime
      ).toFixed(0);
    }
  }
  Globals.state.observe(debounce(renderUI));
  callAfterRender(() => Globals.designer.restoreFocus());
  renderUI();
}

/* Watch for updates happening in other tabs */
const channel = new BroadcastChannel("os-dpi");
/** @param {MessageEvent} event */
channel.onmessage = (event) => {
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
  channel.postMessage(message);
});

// open and close the ide with the d key
/** @param {KeyboardEvent} event */
// document.addEventListener("keydown", (event) => {
//   if (event.key == "d") {
//     const target = /** @type {HTMLElement} */ (event.target);
//     if (target && target.tagName != "INPUT" && target.tagName != "TEXTAREA") {
//       event.preventDefault();
//       event.stopPropagation();
//       if (Globals.state) {
//         document.body.classList.toggle("designing");
//         Globals.state.update({ editing: !Globals.state.get("editing") });
//       }
//     }
//   }
// });
//
// watch for changes to the hash such as using the browser back button
window.addEventListener("hashchange", () => {
  sessionStorage.clear();
  start();
});

/* Attempt to understand pointer events on page update */
// import { log } from "./log";
// let etype = "";
// for (const eventName of [
//   "pointerover",
//   "pointerout",
//   "pointermove",
//   "pointerdown",
//   "pointerup",
// ]) {
//   document.addEventListener(eventName, (event) => {
//     if (
//       (event.type != "pointermove" || event.type != etype) &&
//       event.target instanceof HTMLElement &&
//       event.target.closest("#UI")
//     ) {
//       etype = event.type;
//       log(event.type, event);
//     }
//   });
// }
//
/** @typedef {PointerEvent & { target: HTMLElement }} ClickEvent */
// I think this code mapped clicks back to the tree but no longer...
// document.addEventListener("click", (/** @type {ClickEvent} */ event) => {
//   const target = event.target;
//   let text = "";
//   for (let n = target; n.parentElement && !text; n = n.parentElement) {
//     text = n.textContent || "";
//   }
//   let id = "none";
//   if (target instanceof HTMLButtonElement && target.dataset.id) {
//     id = target.dataset.id;
//   } else {
//     const div = target.closest('div[id^="osdpi"]');
//     if (div) {
//       id = div.id;
//     }
//   }
// });

start();
