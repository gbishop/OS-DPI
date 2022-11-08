/** Global Hot Keys for keyboard access */

import Globals from "app/globals";
import { render, html } from "uhtml";
import "css/hotkeys.css";
import { TabPanel } from "./tabcontrol";
import {
  TreeBase,
  MenuActionAdd,
  MenuActionDelete,
  MenuActionMove,
} from "./treebase";
import { callAfterRender } from "app/render";

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
    console.log("focus", currentTab);
    currentTab.focus();
    return;
  }
  const tabs = /** @type {HTMLButtonElement[]} */ ([
    ...document.querySelectorAll(".designing .tabcontrol .buttons button"),
  ]);
  console.log({ tabs });
  if (!tabs.length) return;
  console.log("focus", tabs[0]);
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
    // why do I have to restore the focus. Shouldn't I be able to leave it where it is?
    // uhtml can redraw the page without trashing focus.
    // why not here?
    // it must have something to do with the focus moving to the button on click?
    return html`<button
      onclick=${() => {
        render(where, html`<!--empty-->`);
        const nextId = action.apply();
        console.log({ nextId, panel });
        // we're looking for the settings view but we have the id of the user view
        panel.lastFocused = nextId + "-settings";
        callAfterRender(() => panel.parent.restoreFocus());
        panel.update();
      }}
    >
      ${label}
    </button>`;
  });

  render(where, html`${buttons}`);
}
