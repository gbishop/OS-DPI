import { openDB } from "idb/with-async-ittr";

class DB {
  constructor() {
    this.dbPromise = openDB("os-dpi", 1, {
      async upgrade(db) {
        let objectStore = db.createObjectStore("store", {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("by-name", "name");
        objectStore.createIndex("by-name-type", ["name", "type"]);
      },
    });
  }

  /**
   * return list of names of designs in the db
   * @returns {Promise<string[]>}
   */
  async names() {
    const db = await this.dbPromise;
    const index = db.transaction("store", "readonly").store.index("by-name");
    const result = [];
    for await (const cursor of index.iterate(null, "nextunique")) {
      result.push(/** @type {string} */ (cursor.key));
    }
    return result;
  }

  /** Return the most recent record for the name and type
   * @param {string} name
   * @param {string} type
   * @param {any} defaultValue
   * @returns {Promise<Object>}
   */
  async read(name, type, defaultValue) {
    const db = await this.dbPromise;
    const index = db
      .transaction("store", "readonly")
      .store.index("by-name-type");
    const cursor = await index.openCursor([name, type], "prev");
    return cursor?.value.data || defaultValue;
  }

  /** Add a new record
   * @param {string} name
   * @param {string} type
   * @param {Object} data
   * @returns {Promise<IDBValidKey>}
   */
  async write(name, type, data) {
    const db = await this.dbPromise;
    return db.put("store", { name, type, data });
  }

  /** Undo by deleting the most recent record
   * @param {string} name
   * @param {string} type
   * @returns {Promise<Object>}
   */
  async undo(name, type) {
    const db = await this.dbPromise;
    const index = db
      .transaction("store", "readwrite")
      .store.index("by-name-type");
    const cursor = await index.openCursor([name, type], "prev");
    if (cursor) await cursor.delete();
    return this.read(name, type);
  }
}

export default new DB();
