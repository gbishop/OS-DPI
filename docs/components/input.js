/** Variations on encapsulated input controls */

import { html } from "../_snowpack/pkg/uhtml.js";
import suggest from "./suggest.js";

/**
 * @typedef {Object} InputOptions
 * @property {string} type
 * @property {string} name
 * @property {string} label
 * @property {string} [help]
 * @property {boolean} [labelHidden]
 * @property {string|string[]} value
 * @property {Set<string>} [choices]
 * @property {Set<string>} [suggestions]
 * @property {(value: any, input?: HTMLInputElement) => string} [validate]
 * @property {(name: string, value: any) => void} [update]
 * @property {string} [className]
 */

const dataListMap = new WeakMap();
let dataListCount = 0;

/** @param {string[]} choices */
function createDataList(choices) {
  if (!choices) {
    return {
      id: null,
      render() {
        return html``;
      },
    };
  }
  if (!dataListMap.has(choices)) {
    const id = `DataList${dataListCount++}`;
    dataListMap.set(choices, {
      id,
      render() {
        return html`<datalist id=${id}>
          ${Array.from(choices).map(
            (choice) => html`<option>${choice}</option>`
          )}
        </datalist>`;
      },
    });
    return dataListMap.get(choices);
  }
}

/**
 * Generate an input element
 *
 * @param {InputOptions} options
 */
export function textInput(options) {
  const list = createDataList((options.choices && [...options.choices]) || []);
  return html` <label for=${options.name} ?hidden=${!!options.labelHidden}
      >${options.label}</label
    >
    <div class=${["suggest", options.className || ""].join(" ")}>
      <input
        type=${options.type}
        id=${options.name}
        name=${options.name}
        .value=${options.value}
        help=${options.help}
        onchange=${(/** @type {InputEventWithTarget} */ event) => {
          const input = event.target;
          const value = input.value.trim();
          const msg = (options.validate && options.validate(value)) || "";
          input.setCustomValidity(msg);
          input.reportValidity();
          if (!msg) options.update && options.update(options.name, value);
        }}
        list=${list.id}
        autocomplete="off"
        ref=${suggest(options.suggestions)}
      />
      <div />
    </div>
    ${list.render()}`;
}
