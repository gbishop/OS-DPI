import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import { Functions } from "../eval.js";
import merge from "../_snowpack/pkg/mergerino.js";
import css from "../_snowpack/pkg/ustyler.js";
import Globals from "../globals.js";

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

class Display extends Base {
  static defaultProps = {
    stateName: "$Display",
    background: "white",
    fontSize: "2",
    scale: "1",
  };
  static functionsInitialized = false;

  template() {
    const style = styleString({
      backgroundColor: this.props.background,
      fontSize: this.props.fontSize + "rem",
    });
    const { state } = Globals;
    /** @type {Hole[]} */
    let content = [];
    /** @type {String|Editor} */
    let value = state.get(this.props.stateName) || "";
    if (typeof value === "string" || value instanceof String) {
      // strip any slot markup
      value = value.replaceAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g, "$2");
      content = [html`${value}`];
    } else {
      let editor = /** @type {Editor} */ (value);
      // otherwise it is an editor object
      // highlight the current slot
      let i = 0;
      content = editor.message.split(/(\$\$.*?\$\$)/).map((part) => {
        const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
        if (m) {
          if (i === editor.slotIndex) {
            // highlight the current slot
            return html`<b>${editor.slots[i++].value}</b>`;
          } else {
            return html`${editor.slots[i++].value.replace(/^\*/, "")}`;
          }
        }
        return html`${part}`;
      });
    }
    return html`<div
      class="display flex"
      ref=${this}
      style=${style}
      id=${this.id}
    >
      ${content}
    </div>`;
  }

  init() {
    if (!Display.functionsInitialized) {
      Display.functionsInitialized = true;
      let { rules } = Globals;

      /** return true of the message contains slots
       * @param {String|Editor} message
       */
      function hasSlots(message) {
        // console.log("has slots", message);
        if (message instanceof Object) {
          return message.slots.length > 0;
        }
        return message.indexOf("$$") >= 0;
      }

      /** initialize the editor
       * @param {String} message
       * @returns Editor
       */
      function init(message) {
        // console.log("init", message);
        const slots = Array.from(
          message.matchAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g)
        ).map((m) => m.groups);
        return {
          message,
          slots,
          slotIndex: 0,
          slotName: (slots[0] && slots[0].name) || "",
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
              rules.queueEvent("okSlot", "press");
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
          if (!old) return;
          const slotIndex = old.slotIndex + 1;
          if (slotIndex >= old.slots.length) {
            rules.queueEvent("okSlot", "press");
          }
          return merge(old, { slotIndex });
        };
      }

      /** duplicate the current slot
       */
      function duplicate() {
        /** @param {Editor} old
         */
        return (old) => {
          const matches = Array.from(
            old.message.matchAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g)
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

      Functions["slots"] = {
        init,
        cancel,
        update,
        hasSlots,
        duplicate,
        nextSlot,
        strip,
      };
    }
  }

  get name() {
    return this.props.name || this.props.stateName;
  }
}
/* TODO: refactor the multiple versions of this formatting code */

/** strip slots markup
 * @param {String|Editor} value
 * @returns {String}
 */
export function strip(value) {
  if (typeof value === "string" || value instanceof String) {
    // strip any slot markup
    value = value.replaceAll(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/g, "$2");
    return value;
  }
  let editor = /** @type {Editor} */ (value);
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

componentMap.addMap("display", Display);

css`
  .display {
    border: 1px solid black;
    padding: 0.25em;
    box-sizing: border-box;
    font-size: 200%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;
