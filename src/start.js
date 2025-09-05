import "@ungap/custom-elements";
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
import Globals from "./globals";
import { PatternList } from "./components/access/pattern";
import { MethodChooser } from "./components/access/method";
import { CueList } from "./components/access/cues";
import { Actions } from "./components/actions";
import { callAfterRender, safeRender, postRender } from "./render";
import { Designer } from "components/designer";
import { workerCheckForUpdate } from "components/serviceWorker";
import { accessed } from "./eval";
import LocationTracker from "./components/locationTracker.js";


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
  let editing = true;
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const fetch = params.get("fetch");
    console.log({ fetch });
    if (fetch) {
      await pleaseWait(
        db.readDesignFromURL(fetch, window.location.hash.slice(1)),
      );
      editing = params.get("edit") !== null;
      window.history.replaceState(
        {},
        document.title,
        window.location.origin + window.location.pathname + "#" + db.designName,
      );
    }
  }
  let name = window.location.hash.slice(1);
  if (!name) {
    name = await db.uniqueName("new");
    window.location.hash = `#${name}`;
  }
  db.setDesignName(name);
  const dataArray = await db.read("content", []);
  const noteArray = await db.read("notes", []);
  await pageLoaded;

  Globals.data = new Data(dataArray);
  Globals.data.setNoteRows(noteArray);
  const layout = await Layout.load(Layout);
  Globals.layout = layout;
  Globals.state = new State(`UIState`);
  Globals.actions = await Actions.load(Actions);
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
  Globals.state.define("editing", editing); // for now
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
    // report the time to draw the frame
    if (location.host.startsWith("localhost")) {
      const startTime = performance.now();
      const timer = document.getElementById("timer");
      if (timer) {
        // I think this makes it wait until all drawing is done.
        requestAnimationFrame(() => {
          setTimeout(() => {
            timer.innerText = `${(performance.now() - startTime).toFixed(0)}ms`;
          });
        });
      }
    }
    // the real update begins here
    const editing = Globals.state.get("editing");
    document.body.classList.toggle("designing", editing);
    safeRender("cues", Globals.cues);
    safeRender("UI", Globals.layout.children[0]);
    if (editing) {
      safeRender("toolbar", toolbar);
      safeRender("tabs", Globals.designer);
      safeRender("monitor", monitor);
      safeRender("errors", Globals.error);
    }
    postRender();
    Globals.method.refresh();
    // clear the accessed bits for the next cycle
    accessed.clear();
    // clear the updated bits for the next cycle
    Globals.state.clearUpdated();

    workerCheckForUpdate();
    document.dispatchEvent(new Event("rendercomplete"));
  }
  Globals.state.observe(debounce(renderUI));
  callAfterRender(() => Globals.designer.restoreFocus());
  renderUI();

  /* ---------- Location ---------- */
  Globals.locationTracker = new LocationTracker();
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
    } else if (message.action == "unload") {
      window.close();
      if (!window.closed) {
        window.location.hash = "new";
      }
    }
  }
};
db.addUpdateListener((message) => {
  channel.postMessage(message);
});

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

start();
