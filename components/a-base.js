import { render, html } from "uhtml";
import { state } from "../state";
import * as designer from "../designer";

let AId = 0;

/** convert a color string to hex
 * @param {String} str - the color name or other representation
 */
function standardize_color(str) {
  var ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = str;
  return ctx.fillStyle;
}

export default class ABase extends HTMLElement {
  /**
   * I'm using a string for observed values instead of an array. I'm lazy
   */
  static observed = "";

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
      this.copyProps();
      if (!this.id) {
        this.id = `id-${++AId}`;
      }
      this.initialized = true;
      this.init();
    }
    this.render();
  }

  /**
   * Use this like the contructor but it happens after the initial connection
   * to the page.
   */
  init() {}

  /**
   * called when the element is removed from the page
   */
  disconnectedCallback() {}

  /**
   * Copy changed attributes into element properties if the property already exists.
   * If the value changed, invoke an update.
   * @param {string} name - value being changed
   * @param {string} _ - the previous value
   * @param {string} newValue - the new value
   */
  attributeChangedCallback(name, _, newValue) {
    if (this[name] !== "undefined" && this[name] != newValue) {
      this[name] = newValue;
      if (this.initialized && this.isConnected) {
        state.update();
      }
    }
  }

  static get observedAttributes() {
    return this.observed.split(" ");
  }

  /**
   * Return the content for element.
   * @returns {import('uhtml').Hole | void }
   */
  template() {}

  /**
   * Render the element content
   */
  render() {
    // console.log("render", this);
    const content = this.template();
    if (content) {
      render(this, content);
    }
  }

  /**
   * @returns {string|import("uhtml").Hole}
   */
  get designerName() {
    return this.tagName;
  }

  get designerChildren() {
    return [...this.children];
  }

  designerHandleChildren() {
    const children = this.designerChildren.map((child) => {
      if (child instanceof ABase) {
        return html`<li>${child.designer()}</li>`;
      } else {
        return html`<li>${child.tagName}</li>`;
      }
    });
    return html`<ul style=${this.designerStyle}>
      ${children}
    </ul>`;
  }

  designerPropUpdate(name, event) {
    let value = event.target.value;
    if (typeof this[name] === "number") {
      value = parseInt(value);
      if (isNaN(value)) value = 0;
    }
    this[name] = value;
    console.log("update", name, value);
    this.render();
    designer.render();
  }

  getColor(color) {
    if (!color.length) {
      // get the color from up the tree
      var div = document.createElement("div");
      document.head.appendChild(div);
      var defaultColor = window.getComputedStyle(div).backgroundColor;
      document.head.removeChild(div);

      /** @type {Element} */
      let el = this;
      while (true) {
        color = window.getComputedStyle(el).backgroundColor;
        if (color != defaultColor) break;
        if (!el.parentElement) {
          color = "#ffffff";
          break;
        }
        el = el.parentElement;
      }
    }
    return standardize_color(color);
  }

  designerPropControl(name) {
    let type = "text";
    let value = this[name];
    // this is a hack, we need types
    if (name === "background") {
      type = "color";
    } else if (typeof this[name] === "number" || name == "scale") {
      type = "number";
    }
    const id = `${this.id}-${name}`;
    return html`<tr>
      <td><label for=${id}>${name}</label></td>
      <td>
        ${type == "color"
          ? html`<color-input
              id=${id}
              value=${value}
              onchange=${(event) => this.designerPropUpdate(name, event)}
            />`
          : html` <input
              id=${id}
              type=${type}
              value=${value}
              onchange=${(event) => this.designerPropUpdate(name, event)}
            />`}
      </td>
    </tr>`;
  }

  designerHighlight(open) {
    this.style.border = open ? "solid red" : "";
  }

  get designerStyle() {
    return undefined;
  }

  designer() {
    const controls = this.props.map((name) => this.designerPropControl(name));
    const style = this.designerStyle;
    return html`<li>
      <details
        ontoggle=${(event) => this.designerHighlight(event.target.open)}
        style=${style}
      >
        <summary>${this.designerName}</summary>
        <table>
          <tbody>
            ${controls}
          </tbody>
        </table>
      </details>
      ${this.designerHandleChildren()}
    </li>`;
  }
}
