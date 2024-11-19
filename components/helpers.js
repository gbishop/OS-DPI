import { html } from "uhtml";

/**
 * Interpolate values into a string using {{name}} for values to replace
 * @param {string} template - string to edit
 * @param {Object<string,string|number|boolean>} values - values to interpolate
 * @returns {string} - interpolated string
 */
export function interpolate(template, values) {
  return template.replaceAll(
    /{{\s*(\w+)\s*}}/g,
    (_, name) => values[name]?.toString() || "",
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
