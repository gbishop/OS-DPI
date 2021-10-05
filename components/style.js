import { html, render } from "uhtml";
import { ColorNames } from "./color-names";

function isValidColor(strColor) {
  if (strColor in ColorNames) {
    return true;
  }
  var s = new Option().style;
  s.color = strColor;

  // return 'false' if color wasn't assigned
  return s.color !== "";
}

export function getColor(name) {
  return ColorNames[name] || name;
}

/** @param {Partial<CSSStyleDeclaration>} style */
function normalizeStyle(style) {
  return Object.fromEntries(
    Object.entries(style)
      .filter(([_, value]) => value.toString().length)
      .map(([key, value]) =>
        key.toLowerCase().indexOf("color") >= 0
          ? [key, getColor(value)]
          : [key, value.toString()]
      )
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
    ""
  );
}

class ColorInput extends HTMLElement {
  value = "";

  /**
   * Copy attribute values from the HTML into the element properties.
   * This isn't required if you listed the values in observed
   */
  copyProps() {
    this.props = Object.getOwnPropertyNames(this);
    // console.log(this.props);
    for (const { name, value } of this.attributes) {
      if (this.hasOwnProperty(name)) {
        if (typeof this[name] == "number") {
          this[name] = +value;
        } else {
          this[name] = value;
        }
      }
    }
  }

  /**
   * Called when the element is added to a page. The first time this is called
   * I will copy the props and call the init method
   */
  connectedCallback() {
    if (!this.hasOwnProperty("initialized")) {
      this.initialized = true;
      this.copyProps();
      this.init();
    }
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
    if (!isValidColor(input.value)) {
      input.setCustomValidity("invalid color");
      input.reportValidity();
    } else {
      input.setCustomValidity("");
      const div = this.querySelector("div");
      div.style.background = getColor(input.value);
    }
  }
  render() {
    render(
      this,
      html`<input
          type="text"
          value=${this.value}
          list="ColorNames"
          onchange=${() => this.validate()}
        />
        <div
          class="swatch"
          style=${`background-color: ${getColor(this.value)}`}
        ></div>
        <span />`
    );
  }
}

customElements.define("color-input", ColorInput);
