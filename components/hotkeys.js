/** Global Hot Keys for keyboard access */

import Globals from "app/globals";
import "css/hotkeys.css";
import { TabPanel } from "./tabcontrol";
import { TreeBase } from "./treebase";
import { callAfterRender } from "app/render";

// document.addEventListener("keydown", DesignerToggle, { capture: true });

let HKState = "idle";

function showHints() {
  document.body.classList.add("hints");
}

function clearHints() {
  document.body.classList.remove("hints");
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
    showHints();
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
  } else if (HKState == "Alt") {
    const hints = [...document.querySelectorAll(".hinted span")];
    const keys = hints.map((hint) => hint.textContent.toLowerCase());
    console.log({ keys, key: event.key });
    const index = keys.indexOf(event.key);
    if (index >= 0) {
      const hint = hints[index];
      const target = hint.parentElement.querySelector("button,input");
      console.log({ hint, target });
      event.preventDefault();
      target.focus();
      // target.click();
    }
    HKState = "idle";
    clearHints();
  }

  // } else if (event.key == "t" && HKState == "Alt") {
  //   HKState = "idle";
  //   clearHints();
  //   focusTabs();
  //   event.preventDefault();
  // } else {
  //   HKState = "idle";
  //   clearHints();
  // }
  // console.log("active element", document.activeElement);
}

document.addEventListener("keydown", HotKeyHandler, { capture: true });
