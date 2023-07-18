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
import { callAfterRender, safeRender, postRender } from "./render";
import { Designer } from "components/designer";
import { workerCheckForUpdate } from "components/serviceWorker";
import { TrackyMouse } from "./public/tracky-mouse/tracky-mouse.js";
import "css/tracky-mouse.css";

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
  let name = window.location.hash.slice(1);
  if (!name) {
    name = await db.uniqueName("new");
    window.location.hash = `#${name}`;
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
    workerCheckForUpdate();
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

TrackyMouse.dependenciesRoot = "./tracky-mouse";
TrackyMouse.loadDependencies().then(function () {
  TrackyMouse.init();
  TrackyMouse.useCamera();

  // Pointer event simulation logic should be built into tracky-mouse in the future.
  const getEventOptions = ({ x, y }) => {
    return {
      view: window, // needed so the browser can calculate offsetX/Y from the clientX/Y
      clientX: x,
      clientY: y,
      pointerId: 1234567890, // a special value so other code can detect these simulated events
      pointerType: "mouse",
      isPrimary: true,
    };
  };
  let last_el_over;
  TrackyMouse.onPointerMove = (x, y) => {
    const target = document.elementFromPoint(x, y) || document.body;
    if (target !== last_el_over) {
      if (last_el_over) {
        const event = new PointerEvent(
          "pointerout",
          Object.assign(getEventOptions({ x, y }), {
            button: 0,
            buttons: 1,
            bubbles: true,
            cancelable: false,
          })
        );
        last_el_over.dispatchEvent(event);
      }
      const event = new PointerEvent(
        "pointerover",
        Object.assign(getEventOptions({ x, y }), {
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: false,
        })
      );
      target.dispatchEvent(event);
      last_el_over = target;
    }
    const event = new PointerEvent(
      "pointermove",
      Object.assign(getEventOptions({ x, y }), {
        button: 0,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      })
    );
    target.dispatchEvent(event);
  };
});
