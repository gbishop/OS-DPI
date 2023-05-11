import { Messages } from "./components/errors";
import { Data } from "./data";
import { State } from "./state";
import "./components";
import { Layout } from "./components/layout";
import { Monitor } from "./components/monitor";
import { ToolBar } from "./components/toolbar";
import db from "./db";
import pleaseWait from "./components/wait";
import "css/designer.css";
import "css/colors.css";
import { clearAccessChanged } from "./components/access";
import Globals from "./globals";
import { PatternList } from "./components/access/pattern";
import { MethodChooser } from "./components/access/method";
import { CueList } from "./components/access/cues";
import { Actions } from "./components/actions";
import { welcome } from "./components/welcome";
import { callAfterRender, safeRender, postRender } from "./render";
import { Designer } from "components/designer";

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
    const fetch = params.get("fetch");
    if (fetch) {
      await pleaseWait(db.readDesignFromURL(fetch));
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

  const layout = await Layout.load(Layout);
  Globals.layout = layout;
  Globals.tree = layout.children[0];
  Globals.state = new State(`UIState`);
  Globals.actions = await Actions.load(Actions);
  Globals.data = new Data(dataArray);
  Globals.cues = await CueList.load(CueList);
  Globals.patterns = await PatternList.load(PatternList);
  Globals.method = await MethodChooser.load(MethodChooser);
  Globals.restart = async () => {
    // tear down any existing event handlers before restarting
    Globals.method.stop();
    start();
  };
  Globals.error = new Messages();

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
  Globals.designer = /** @type {Designer} */ (
    Designer.fromObject({
      className: "Designer",
      props: { tabEdge: "top", stateName: "designerTab" },
      children: [
        layout,
        {
          className: "Content",
          props: {},
          children: [],
        },
        Globals.actions,
        Globals.cues,
        Globals.patterns,
        Globals.method,
      ],
    })
  );

  /* ToolBar */
  const toolbar = ToolBar.create("ToolBar", null);
  toolbar.init();

  /* Monitor */
  const monitor = Monitor.create("Monitor", null);
  monitor.init();

  function renderUI() {
    const startTime = performance.now();
    document.body.classList.toggle("designing", Globals.state.get("editing"));
    // clear the changed flag, TODO there must be a better way!
    clearAccessChanged();
    safeRender("cues", Globals.cues);
    safeRender("UI", Globals.tree);
    safeRender("toolbar", toolbar);
    safeRender("tabs", Globals.designer);
    safeRender("monitor", monitor);
    safeRender("errors", Globals.error);
    postRender();
    Globals.method.refresh();
    if (location.host.startsWith("localhost")) {
      const timer = document.getElementById("timer");
      if (timer) {
        timer.innerText = (performance.now() - startTime).toFixed(0);
      }
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
    } else if (message.action == "rename" && message.newName) {
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

// watch for window resize and force a redraw
window.addEventListener("resize", () => {
  if (!Globals.state) return;
  Globals.state.update();
});

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
