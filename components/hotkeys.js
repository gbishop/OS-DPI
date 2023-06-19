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
  document.getElementById("UI")?.focus();
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
 * @enum {string}
 */
const State = {
  user: "user",
  userA: "userA",
  editing: "editing",
  hints: "hints",
};

/** @type {State | undefined} */
let state = undefined;

/**
 * State machine transition table
 * @typedef {Object} Transition
 * @property {State} state - current state
 * @property {RegExp} key - input key
 * @property {State} next - next state
 * @property {Function} [call] - function to call on entering
 */

/** @type {Transition[]} */
// prettier-ignore
const transitions = [
  { state: State.user,    key: /alt/i,    next: State.userA                       },
  { state: State.userA,   key: /d/i,      next: State.editing, call: editMode     },
  { state: State.editing, key: /alt/i,    next: State.hints,   call: showHints    },
  { state: State.hints,   key: /d/i,      next: State.user,    call: userMode     },
  { state: State.hints,   key: /[nfeah]/i,next: State.editing, call: clickToolbar },
  { state: State.hints,   key: /t/i,      next: State.editing, call: focusTabs    },
  { state: State.hints,   key: /u/i,      next: State.editing, call: focusUI      },
  { state: State.hints,   key: /p/i,      next: State.editing, call: focusPanel   },
  { state: State.hints,   key: /shift/i,  next: State.hints                       },
  { state: State.hints,   key: /.*/i,     next: State.editing, call: clearHints   },
];

/** Toolbar activation and hints
 *
 * @param {KeyboardEvent} event */
function HotKeyHandler(event) {
  if (!Globals.state) return;
  if (!state) {
    // initialize the state on first call
    state = Globals.state.get("editing") ? State.editing : State.user;
  }
  const key = event.key;
  if (!key) return;
  for (const T of transitions) {
    if (T.state == state) {
      const match = key.match(T.key);
      if (match && match[0].length === key.length) {
        // exact match
        event.preventDefault();
        if (event.repeat) break; // kill key repeat
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
