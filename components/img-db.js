import db from "../db";

/**
 * An image that is extracted from the database
 */
class imgFromDb extends HTMLElement {
  constructor() {
    super();
    this.appendChild(new Image());
  }

  static get observedAttributes() {
    return ["src"];
  }

  /** @param {string} name
   * @param {string} oldValue
   * @param {string} newValue */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === "src" && oldValue !== newValue) {
      const url = await db.getImageURL(newValue);
      const img = /** @type {HTMLImageElement} */ (this.firstChild);
      img.src = url;
    }
  }
}
customElements.define("img-db", imgFromDb);
