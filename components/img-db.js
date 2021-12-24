import { render } from "uhtml";
import db from "../db";

/**
 * An image that is extracted from the database
 */
class imgFromDb extends HTMLElement {
  static get observedAttributes() {
    return ["name"];
  }

  /** @param {string} name */
  async attributeChangedCallback(_1, _2, name) {
    const img = await db.getImage(name);
    render(this, img);
  }
}
customElements.define("img-db", imgFromDb);
