/** Gather Slots code into one module
 *
 * Slots are coded in strings like $$ kind = value $$ where kind is used
 * to access the Content for choices and value is the initial and default value.
 *
 */

import { html } from "uhtml";
import { Functions } from "app/eval";
import merge from "mergerino";
import Globals from "app/globals";

/** Slot descriptor
 * @typedef {Object} Slot
 * @property {string} name - the name of the slot list
 * @property {string} value - the current value
 */

/** Editor state
 * @typedef {Object} Editor
 * @property {"editor"} type
 * @property {string} message - the message text
 * @property {Slot[]} slots - slots if any
 * @property {number} slotIndex - slot being edited
 * @property {string} slotName - current slot type
 * @property {string} value - value stripped of any markup
 */

/**
 * Edit slots markup to replace with highlighed values
 * @param {string|Editor} msg - the string possibly containing $$ kind = value $$ markup
 * @returns {Hole[]} - formatted string
 */
export function formatSlottedString(msg) {
  if (typeof msg === "string") {
    return msg.split(/(\$\$.*?\$\$)/).map((part) => {
      const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
      if (m) {
        return html`<b>${m.groups?.value || ""}</b>`;
      } else {
        return html`<span>${part}</span>`;
      }
    });
  } else if (typeof msg === "object" && msg.type === "editor") {
    let editor = msg;
    // otherwise it is an editor object
    // highlight the current slot
    let i = 0;
    return editor.message.split(/(\$\$.*?\$\$)/).map((part) => {
      const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
      if (m) {
        if (i === editor.slotIndex) {
          // highlight the current slot
          return html`<b>${editor.slots[i++].value}</b>`;
        } else {
          return html`<span
            >${editor.slots[i++].value.replace(/^\*/, "")}</span
          >`;
        }
      }
      return html`<span>${part}</span>`;
    });
  } else {
    return [];
  }
}

/** Edit slots markup to replace with values
 * @param {string|Editor} value
 * @returns {string}
 */
export function toString(value) {
  value ??= "";
  if (typeof value === "string") {
    // strip any slot markup
    value = value.replaceAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g, "$2");
    return value;
  } else if (typeof value === "object" && value.type === "editor") {
    let editor = value;
    // otherwise it is an editor object
    let i = 0;
    const parts = editor.message.split(/(\$\$.*?\$\$)/).map((part) => {
      const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
      if (m) {
        return editor.slots[i++].value.replace(/^\*/, "");
      }
      return part;
    });
    return parts.join("");
  }
  return value.toString();
}

/** We need to keep some additional state around to enable editing slotted messages.
 *
 * These functions are used in Updates to manipulate the state.
 */

/** Test if this message has slots
 * @param {string|Editor} message
 * @returns {boolean}
 */
export function hasSlots(message) {
  if (message instanceof Object && message.type === "editor") {
    return message.slots.length > 0;
  } else if (typeof message == "string") return message.indexOf("$$") >= 0;
  return false;
}

/** initialize the editor
 * @param {String} message
 * @returns Editor
 */
function init(message) {
  message = message || "";
  const slots = Array.from(
    message.matchAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g),
  ).map((m) => m.groups);
  let result = {
    type: "editor",
    message,
    slots,
    slotIndex: 0,
    slotName: (slots[0] && slots[0].name) || "",
  };
  return result;
}

/** cancel slot editing
 * @returns Editor
 */
function cancel() {
  return {
    type: "editor",
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
  message ??= "";
  /** @param {Editor} old
   * @returns {Editor|string}
   */
  return (old) => {
    // copy the slots from the old value
    if (!old || !old.slots) {
      return "";
    }
    const slots = [...old.slots];
    let slotIndex = old.slotIndex;
    // replace the current one
    if (message.startsWith("*")) {
      slots[slotIndex].value = message;
    } else {
      if (slots[slotIndex].value.startsWith("*")) {
        slots[slotIndex].value = `${slots[slotIndex].value} ${message}`;
      } else {
        slots[slotIndex].value = message;
      }
      slotIndex++;
      if (slotIndex >= slots.length) {
        Globals.actions.queueEvent("okSlot", "press");
      }
    }
    return merge(old, {
      slots,
      slotIndex,
      slotName: slots[slotIndex]?.name,
    });
  };
}

/** advance to the next slot
 */
function nextSlot() {
  /** @param {Editor} old
   */
  return (old) => {
    if (!old || !old.slots) return;
    const slotIndex = old.slotIndex + 1;
    if (slotIndex >= old.slots.length) {
      Globals.actions.queueEvent("okSlot", "press");
    }
    return merge(old, { slotIndex, slotName: old.slots[slotIndex]?.name });
  };
}

/** duplicate the current slot
 */
function duplicate() {
  /** @param {Editor} old
   */
  return (old) => {
    if (!old || !old.slots) return;
    const matches = Array.from(
      old.message.matchAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g),
    );
    const current = matches[old.slotIndex];
    if (current !== undefined && current.index !== undefined) {
      const message =
        old.message.slice(0, current.index) +
        current[0] +
        " and " +
        current[0] +
        old.message.slice(current.index + current[0].length);
      const slots = [
        ...old.slots.slice(0, old.slotIndex + 1),
        { ...old.slots[old.slotIndex] }, // copy it
        ...old.slots.slice(old.slotIndex + 1),
      ];
      return merge(old, {
        message,
        slots,
      });
    } else {
      return old;
    }
  };
}

/** Get the slot name
 * @param {string|Editor} message
 * @returns string;
 */
function slotName(message) {
  if (typeof message === "object" && message.type === "editor") {
    return message.slotName;
  }
  return "";
}

let functionsInitialized = false;
if (!functionsInitialized) {
  Functions["slots"] = {
    init,
    cancel,
    update,
    hasSlots,
    duplicate,
    nextSlot,
    slotName,
    toString,
  };
}
