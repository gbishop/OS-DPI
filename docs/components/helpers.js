import { html } from "../_snowpack/pkg/uhtml.js";

/**
 * Edit slots markup to replace with values
 * @param {string} msg - the string possibly containing $$ kind = value $$ markup
 * @param {string[]} slotValues - values to replace slots
 * @returns {Hole[]} - formatted string
 */
export function formatSlottedString(msg, slotValues = []) {
  let slotIndex = 0;
  msg = msg || "";
  return msg.split(/(\$\$.*?\$\$)/).map((part) => {
    const m = part.match(/\$\$(?<name>.*?)=(?<value>.*?)\$\$/);
    if (m) {
      return html`<b>${slotValues[slotIndex++] || m.groups?.value || ""}</b>`;
    } else {
      return html`${part}`;
    }
  });
}

/**
 * Interpolate values into a string using {{name}} for values to replace
 * @param {string} template - string to edit
 * @param {Object<string,string>} values - values to interpolate
 * @returns {string} - interpolated string
 */
export function interpolate(template, values) {
  return template.replaceAll(
    /{{\s*(\w+)\s*}}/g,
    (_, name) => values[name] || ""
  );
}
