/** Global Hot Keys for keyboard access */

import Globals from "../globals";
import { render, html } from "uhtml";
import css from "ustyler";
import { TabPanel } from "./tabcontrol";
import {
  TreeBase,
  MenuActionAdd,
  MenuActionDelete,
  MenuActionMove,
} from "./treebase";

// document.addEventListener("keydown", DesignerToggle, { capture: true });

let HKState = "idle";

/** @param {string[]} hints */
function showHints(hints) {
  const hintNode = document.getElementById("HotKeyHints");
  if (!hintNode) return;
  hintNode.innerHTML = hints
    .map((hint) => `<span><b>${hint[0]}</b>${hint.slice(1)}</span>`)
    .join();
  hintNode.classList.add("show");
}

function clearHints() {
  const hintNode = document.getElementById("HotKeyHints");
  hintNode && hintNode.classList.remove("show");
}

function focusTabs() {
  const currentTab = /** @type {HTMLButtonElement} */ (
    document.querySelector(".designing .tabcontrol .buttons button[active]")
  );
  if (currentTab) {
    currentTab.focus();
    return;
  }
  const tabs = /** @type {HTMLButtonElement[]} */ ([
    ...document.querySelectorAll(".designing .tabcontrol .buttons button"),
  ]);
  console.log({ tabs });
  if (!tabs.length) return;
  tabs[0].focus();
}

/** Toolbar activation and hints
 *
 * A hack to try this out.
 *
 * @param {KeyboardEvent} event */
function HotKeyHandler(event) {
  console.log(event);
  const designing = Globals.state.get("editing");
  if (event.key == "Alt") {
    HKState = "Alt";
    showHints(["Tabs"]);
    event.preventDefault();
  } else if (event.key == "d" && HKState == "Alt") {
    HKState = "idle";
    clearHints();
    if (!designing) {
      document.body.classList.add("designing");
      event.preventDefault();
      Globals.state.update({ editing: true });
    } else {
      document.body.classList.remove("designing");
      event.preventDefault();
      Globals.state.update({ editing: false });
    }
  } else if (!designing) {
    HKState = "idle";
    return;
  } else if (event.key == "t" && HKState == "Alt") {
    HKState = "idle";
    clearHints();
    focusTabs();
    event.preventDefault();
  } else {
    HKState = "idle";
    clearHints();
  }
  console.log("active element", document.activeElement);
}

document.addEventListener("keydown", HotKeyHandler, { capture: true });

/**
 * A hack to test the MenuActions
 * @param {TabPanel} panel */
export function updateMenuActions(panel) {
  console.log({ panel });
  if (!panel.lastFocused) {
    console.log("no lastFocused");
    return;
  }
  const component = TreeBase.componentFromId(panel.lastFocused);
  if (!component) {
    console.log("no component");
    return;
  }
  const actions = component.getMenuActions();

  const where = document.getElementById("HotKeyHints");

  const buttons = actions.map((action) => {
    let label = "";
    if (action instanceof MenuActionAdd) {
      label = `+${action.className}`;
    } else if (action instanceof MenuActionDelete) {
      label = `-${action.className}`;
    } else if (action instanceof MenuActionMove) {
      if (action.step < 0) {
        label = "Up";
      } else {
        label = "Down";
      }
    }
    return html`<button onclick=${() => action.apply()}>${label}</button>`;
  });

  render(where, html`${buttons}`);
}

css`
  #HotKeyHints {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
  }

  #HotKeyHints.show {
    display: block;
  }
`;
