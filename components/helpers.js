import { html } from "uhtml";

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
 * @param {Object<string,string|number|boolean>} values - values to interpolate
 * @returns {string} - interpolated string
 */
export function interpolate(template, values) {
  return template.replaceAll(
    /{{\s*(\w+)\s*}}/g,
    (_, name) => values[name]?.toString() || ""
  );
}

/**
 * Convert a name from camelCase to Camel Case
 * @param {string} name
 * @returns {string}
 */
export function fromCamelCase(name) {
  return name
    .replace(/(?!^)([A-Z][a-z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

/**
 * Conditionally show an indicator with a title
 *
 * @param {boolean} toggle
 * @param {string} title
 * @returns {Hole}
 */
export function toggleIndicator(toggle, title) {
  if (toggle) {
    return html`<span class="indicator" title=${title}>&#9679;</span>`;
  } else {
    return html`<!--empty-->`;
  }
}
