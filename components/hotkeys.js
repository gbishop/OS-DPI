/** Global Hot Keys for keyboard access */

import Globals from "app/globals";
import { render, html } from "uhtml";
import "css/hotkeys.css";
import { TabPanel } from "./tabcontrol";
import { TreeBase } from "./treebase";
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
  // console.log(event);
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
  // console.log("active element", document.activeElement);
}

// document.addEventListener("keydown", HotKeyHandler, { capture: true });
