import Introspected from "introspected";

class TreeBaseWithPersist {
  /**
   * @template T
   * @param {T} defaultValue
   * @returns {T}
   */
  fetchPersisted(defaultValue) {
    return JSON.parse(sessionStorage.getItem(this.id)) || defaultValue;
  }
  /** @template T
   * @param {T} value */
  setPersisted(value) {
    sessionStorage.setItem(this.id, JSON.stringify(value));
  }

  /** Values stored here will be persisted across refreshes in sessionStorage */
  persisted = Introspected(this.fetchPersisted({}), (root, _path) => {
    this.setPersisted(root);
  });
}
