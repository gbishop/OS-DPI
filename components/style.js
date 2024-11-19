import { html } from "uhtml";
import { ColorNames } from "./color-names";

/** @param {Event & { target: HTMLInputElement }} event
 */
export function validateColor(event) {
  const input = event.target;
  if (!isValidColor(input.value)) {
    input.setCustomValidity("invalid color");
    input.reportValidity();
    return false;
  } else {
    input.setCustomValidity("");
    const div = /** @type {HTMLElement} */ (input.nextElementSibling);
    div.style.background = getColor(input.value);
    return true;
  }
}

/** @param {string} strColor */
export function isValidColor(strColor) {
  if (strColor.length == 0 || strColor in ColorNames) {
    return true;
  }
  var s = new Option().style;
  s.color = strColor;

  // return 'false' if color wasn't assigned
  return s.color !== "";
}

/** @param {string} name */
export function getColor(name) {
  return ColorNames[name] || name;
}

/** @param {Partial<CSSStyleDeclaration>} style */
function normalizeStyle(style) {
  return Object.fromEntries(
    Object.entries(style)
      .filter(([_, value]) => value && value.toString().length)
      .map(([key, value]) =>
        key.toLowerCase().indexOf("color") >= 0
          ? [key, getColor(/** @type {string} */ (value))]
          : [key, value && value.toString()],
      ),
  );
}

/** @param {HTMLElement} element
 * @param {Partial<CSSStyleDeclaration>} styles */
export function setStyle(element, styles) {
  Object.assign(element.style, normalizeStyle(styles));
}

/** @param {Partial<CSSStyleDeclaration>} styles */
export function styleString(styles) {
  return Object.entries(normalizeStyle(styles)).reduce(
    (acc, [key, value]) =>
      acc +
      key
        .split(/(?=[A-Z])/)
        .join("-")
        .toLowerCase() +
      ":" +
      value +
      ";",
    "",
  );
}

export function colorNamesDataList() {
  return html`<datalist id="ColorNames">
    ${Object.keys(ColorNames).map((name) => html`<option value="${name}" />`)}
  </datalist>`;
}
