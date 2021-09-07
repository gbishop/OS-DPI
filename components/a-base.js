import { render } from "uhtml";
import { state } from "../state";

export default class ABase extends HTMLElement {
  initialized = false;
  /**
   * I'm using a string for observed values instead of an array. I'm lazy
   */
  static observed = "";

  /**
   * Copy attribute values from the HTML into the element properties.
   * This isn't required if you listed the values in observed
   */
  copyProps() {
    for (const { name, value } of this.attributes) {
      if (this.hasOwnProperty(name)) {
        // console.log("cp", name, value, this[name]);
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
    if (!this.initialized) {
      this.copyProps();
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
}
