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
      console.log("fetch", newValue);
      const url = await db.getImageURL(newValue);
      this.src = url;
    }
  }
}
customElements.define("img-db", imgFromDb, { extends: "img" });
