/** Global Hot Keys for keyboard access */

import Globals from "../globals";
import css from "ustyler";

/**
 * Toggle the designer interface on and off.
 *
 * I chose the multikey trigger to avoid accidental activation but
 * it is likely to be unacceptable to designers who struggle to use
 * the keyboard.
 *
 * What are the alternatives?
 *
 * @param {KeyboardEvent} event */
function DesignerToggle(event) {
  if (event.altKey && event.ctrlKey && event.shiftKey) {
    document.body.classList.toggle("designing");
    Globals.state.update({ editing: !Globals.state.get("editing") });
  }
}

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
  hintNode.classList.remove("show");
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
  if (event.altKey && event.ctrlKey && event.shiftKey) {
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
    return;
  } else if (event.key == "Alt") {
    HKState = "Alt";
    showHints(["Tabs"]);
    event.preventDefault();
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

css`
  #HotKeyHints {
    display: none;
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
