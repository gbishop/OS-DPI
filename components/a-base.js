import { render, html } from "uhtml";
import { state } from "../state";
import { getColor } from "./color";

let AId = 0;

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
      // make sure we have an id
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

  /**** TODO: does not belong here ****/

  /** @param {Partial<CSSStyleDeclaration>} style */
  normalizeStyle(style) {
    return Object.fromEntries(
      Object.entries(style).map(([key, value]) =>
        key.toLowerCase().indexOf("color") >= 0
          ? [key, getColor(value)]
          : [key, value.toString()]
      )
    );
  }

  /** @param {Partial<CSSStyleDeclaration>} styles */
  setStyle(styles) {
    Object.assign(this.style, this.normalizeStyle(styles));
  }

  /** @param {Partial<CSSStyleDeclaration>} styles */
  getStyleString(styles) {
    return Object.entries(this.normalizeStyle(styles)).reduce(
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

  /**** TODO: above doesn't belong ****/

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
  getName() {
    return this.tagName;
  }

  /**
   * @returns {ABase[]}
   */
  getChildren() {
    const children = [];
    for (const child of super.children) {
      if (child instanceof ABase) {
        children.push(child);
      }
    }
    return children;
  }

  /** @param {boolean} highlight */
  setHighlight(highlight) {
    if (highlight) {
      this.style.border = "4px solid red";
    } else {
      this.style.border = "";
    }
  }

  makeVisible(o) {}
}
