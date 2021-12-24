import db from "../db";

/**
 * An image that is extracted from the database
 */
class imgFromDb extends HTMLImageElement {
  // watch for changes in dbsrc
  static get observedAttributes() {
    return ["dbsrc"];
  }

  /**
   * Handle changes in dbsrc
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue */
  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === "dbsrc" && oldValue !== newValue) {
      let url = newValue;
      // if it contains a slash treat it like an external url
      // if not, fetch it from the db
      if (url.indexOf("/") < 0) url = await db.getImageURL(newValue);
      this.src = url;
    }
  }
}
customElements.define("img-db", imgFromDb, { extends: "img" });
