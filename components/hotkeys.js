/** Global Hot Keys for keyboard access */

import Globals from "app/globals";
import "css/hotkeys.css";

function showHints() {
  document.body.classList.add("hints");
}

function clearHints() {
  document.body.classList.remove("hints");
}

function editMode() {
  Globals.state.update({ editing: true });
}

function userMode() {
  Globals.state.update({ editing: false });
  clearHints();
}

/**
 * Click a toolbar input based on its hint
 * @param {string} key
 */
function clickToolbar(key) {
  clearHints();
  const hint = document.querySelector(`.toolbar div[hint="${key}" i]`);
  if (hint) {
    const input = /** @type {HTMLInputElement} */ (
      hint.querySelector("button,input")
    );
    input.focus();
    input.click();
  }
}

/**
 * Focus on the UI part of the designer for testing keyboard input
 * @returns {void}
 */
function focusUI() {
  clearHints();
  document.getElementById("UI").focus();
}

/**
 * Restore focus to the designer panel
 * @returns {void}
 */
function focusPanel() {
  clearHints();
  Globals.designer.restoreFocus();
}

function focusTabs() {
  clearHints();
  const currentTab = /** @type {HTMLButtonElement} */ (
    document.querySelector("#designer .tabcontrol .buttons button[active]")
  );
  if (currentTab) {
    currentTab.focus();
    return;
  }
  const tabs = /** @type {HTMLButtonElement[]} */ ([
    ...document.querySelectorAll(".designing .tabcontrol .buttons button"),
  ]);
  if (!tabs.length) return;
  tabs[0].focus();
}

/** Implement a state machine for managing the hotkeys
 */
let state = null;

/**
 * State machine transition table
 * @typedef {Object} TransitionTable
 * @property {string} state - current state
 * @property {RegExp} key - optional input key
 * @property {string} next - next state
 * @property {Function} [call] - function to call on entering
 * @property {boolean} [allow] - prevent default unless allowed
 *
 * @type {TransitionTable[]}
 */
const transitions = [
  { state: "user", key: /alt/, next: "userAlt" },
  { state: "userA", key: /d/, next: "designer", call: editMode },
  // { state: "userA", key: /.*/, next: "user", allow: true },
  { state: "editing", key: /alt/, next: "hints", call: showHints },
  { state: "hints", key: /d/, next: "user", call: userMode },
  { state: "hints", key: /[nfea]/, next: "editing", call: clickToolbar },
  { state: "hints", key: /t/, next: "editing", call: focusTabs },
  { state: "hints", key: /u/, next: "editing", call: focusUI },
  { state: "hints", key: /p/, next: "editing", call: focusPanel },
  { state: "hints", key: /shift/, next: "hints", allow: true },
  { state: "hints", key: /.*/, next: "editing", call: clearHints, allow: true },
];

/** Toolbar activation and hints
 *
 * @param {KeyboardEvent} event */
function HotKeyHandler(event) {
  if (!state) {
    state = Globals.state.get("editing") ? "editing" : "user";
  }
  const key = event.key.toLowerCase();
  for (const T of transitions) {
    if (T.state == state) {
      const match = key.match(T.key);
      if (match && match[0].length === key.length) {
        event.preventDefault();
        state = T.next;
        if (T.call) {
          T.call(key);
        }
        break;
      }
    }
  }
}
document.addEventListener("keydown", HotKeyHandler, { capture: true });

window.addEventListener("blur", () => {
  clearHints();
});
