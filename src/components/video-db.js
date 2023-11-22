import db from "app/db";

/**
 * A video that is extracted from the database
 */
export class videoFromDb extends HTMLVideoElement {
  // watch for changes in dbsrc
  static get observedAttributes() {
    return ["dbsrc", "refresh"];
  }

  /**
   * Handle changes in dbsrc
   * @param {string} name
   * @param {string} _
   * @param {string} newValue */
  attributeChangedCallback(name, _, newValue) {
    if (name === "dbsrc" && newValue) {
      this.updateSrcFromDb(newValue);
    }
  }

  /**
   * Look again at the db which may have changed
   */
  async refresh() {
    const url = this.getAttribute("dbsrc") || "";
    return this.updateSrcFromDb(url);
  }

  /** Update the img src from the db or the provided url
   * @param {string} url
   */
  async updateSrcFromDb(url) {
    // if it contains a slash treat it like an external url
    // if not, fetch it from the db
    if (url && url.indexOf("/") < 0) url = await db.getMediaURL(url);
    if (url) this.src = url;
  }
}
customElements.define("video-db", videoFromDb, { extends: "video" });
