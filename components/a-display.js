import { html } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import * as rules from "../rules.js";
import merge from "mergerino";

/** Slot descriptor
 * @typedef {Object} Slot
 * @property {String} name - the name of the slot list
 * @property {String} value - the current value
 */

/** Editor state
 * @typedef {Object} Editor
 * @property {String} message - the message text
 * @property {Slot[]} slots - slots if any
 * @property {Number} slotIndex - slot being edited
 * @property {String} slotName - current slot type
 */

class ADisplay extends ABase {
  state = "$Display";
  background = "inherit";
  scale = 1;

  static observed = "state background scale";

  init() {
    state.define(this.state, "The utterance goes here");
    state.observe(this, this.state);
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
  }

  template() {
    /** @type {String|Editor} */
    let value = state(this.state);
    if (typeof value === "string" || value instanceof String) {
      // strip any slot markup
      value = value.replaceAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g, "$2");
      return html`${value}`;
    }
    let editor = /** @type {Editor} */ (value);
    // otherwise it is an editor object
    // highlight the current slot
    let i = 0;
    const parts = editor.message.split(/(\$\$.*?\$\$)/).map((part) => {
      const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
      if (m) {
        if (i === editor.slotIndex) {
          // highlight the current slot
          return html`<b>${editor.slots[i++].value}</b>`;
        } else {
          return html`${editor.slots[i++].value}`;
        }
      }
      return html`${part}`;
    });
    return html`${parts}`;
  }
}

customElements.define("a-display", ADisplay);

/** return true of the message contains slots
 * @param {String} message
 */
function hasSlots(message) {
  return message.indexOf("$$") >= 0;
}

/** initialize the editor
 * @param {String} message
 * @returns Editor
 */
function init(message) {
  const slots = Array.from(
    message.matchAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g)
  ).map((m) => m.groups);
  return {
    message,
    slots,
    slotIndex: 0,
    slotName: slots[0].name,
  };
}

/** cancel slot editing
 * @returns Editor
 */

function cancel() {
  return {
    message: "",
    slots: [],
    slotIndex: 0,
    slotName: "",
  };
}

/** update the value of the current slot
 * @param {String} message
 */
function update(message) {
  /** @param {Editor} old
   */
  return (old) => {
    // copy the slots from the old value
    const slots = [...old.slots];
    // replace the current one
    slots[old.slotIndex].value = message;
    const slotIndex = old.slotIndex + 1;
    if (slotIndex >= slots.length) {
      rules.queueEvent("okSlot", "press");
    }
    return merge(old, {
      slots,
      slotIndex,
      slotName: slots[slotIndex]?.name,
    });
  };
}

rules.Functions["slots"] = { init, cancel, update, hasSlots };
