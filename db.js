import { openDB } from "idb/with-async-ittr";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import { fileOpen, fileSave } from "browser-fs-access";

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
        let imageStore = db.createObjectStore("images", {
          keyPath: "hash",
        });
        imageStore.createIndex("by-name", "name");
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

  /** Read a design from a zip file
   */
  async readDesign() {
    const blob = await fileOpen({
      mimeTypes: ["application/octet-stream"],
      extensions: [".osdpi", ".zip"],
      description: "OS-DPI designs",
      id: "os-dpi",
    });
    // keep the handle so we can save to it later
    this.handle = blob.handle;
    this.name = blob.name;
    const name = this.name.split(".")[0];

    // clear the previous one
    const db = await this.dbPromise;
    const index = db.transaction("store", "readwrite").store.index("by-name");
    for await (const cursor of index.iterate(name)) {
      await cursor.delete();
    }
    // load the new one
    const zippedBuf = await readAsArrayBuffer(blob);
    const zippedArray = new Uint8Array(zippedBuf);
    const unzipped = unzipSync(zippedArray);
    for (const fname in unzipped) {
      if (fname.endsWith("json")) {
        const text = strFromU8(unzipped[fname]);
        const obj = JSON.parse(text);
        const type = fname.split(".")[0];
        await this.write(name, type, obj);
      } else if (fname.endsWith(".png")) {
        const blob = new Blob([unzipped[fname]], { type: "image/png" });
        const h = await hash(blob);
        const test = await db.get("images", h);
        if (test) {
          console.log(fname, "is dup");
        } else {
          await db.put("images", {
            name: fname,
            content: blob,
            hash: h,
          });
        }
      }
    }
    window.location.hash = name;
  }

  /** Return an image from the database
   * @param {string} name
   * @returns {Promise<HTMLImageElement>}
   */
  async getImage(name) {
    const db = await this.dbPromise;
    const record = await db.getFromIndex("images", "by-name", name);
    const img = new Image();
    img.src = URL.createObjectURL(record.content);
    img.title = record.name;
    return img;
  }

  /** Return an image URL from the database
   * @param {string} name
   * @returns {Promise<string>}
   */
  async getImageURL(name) {
    const db = await this.dbPromise;
    const record = await db.getFromIndex("images", "by-name", name);
    return URL.createObjectURL(record.content);
  }
}

export default new DB();

/** Convert a blob into an array buffer
 * @param {Blob} blob */
function readAsArrayBuffer(blob) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onloadend = () => fr.result instanceof ArrayBuffer && resolve(fr.result);
    fr.readAsArrayBuffer(blob);
  });
}

/** Compute the hash of a blob for de-duping the database
 * @param {Blob} blob */
async function hash(blob) {
  const buf = await readAsArrayBuffer(blob);
  return crypto.subtle.digest("SHA-256", buf);
}
