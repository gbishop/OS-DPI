import { html, render } from "uhtml";
import "css/style.css";
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

class ColorInput extends HTMLElement {
  value = "";
  name = "";
  tabindex = "0";

  /**
   * Called when the element is added to a page. The first time this is called
   * I will copy the props and call the init method
   */
  connectedCallback() {
    if (!Object.hasOwn(this, "initialized")) {
      this.initialized = true;
      this.init();
    }
    this.render();
  }

  static get observedAttributes() {
    return ["name", "value", "tabindex"];
  }

  /**
   * watch for changing attributes
   * @param {string} name
   * @param {string} _
   * @param {string} newValue
   */
  attributeChangedCallback(name, _, newValue) {
    this[name] = newValue;
    this.render();
  }

  init() {
    if (!document.querySelector("datalist#ColorNames")) {
      const list = html.node`<datalist id="ColorNames">
      ${Object.keys(ColorNames).map((name) => html`<option value="${name}" />`)}
      </datalist>`;
      document.body.appendChild(list);
    }
  }
  validate() {
    const input = this.querySelector("input");
    if (!input) return "not found";
    if (!isValidColor(input.value)) {
      input.setCustomValidity("invalid color");
      input.reportValidity();
    } else {
      input.setCustomValidity("");
      const div = this.querySelector("div");
      if (div) div.style.background = getColor(input.value);
    }
  }
  render() {
    render(
      this,
      html`<input
          type="text"
          name=${this.name}
          .value=${this.value}
          list="ColorNames"
          onchange=${() => this.validate()}
          tabindex=${this.tabindex}
        />
        <div
          class="swatch"
          style=${`background-color: ${getColor(this.value)}`}
        ></div>`,
    );
  }
}

customElements.define("color-input", ColorInput);
