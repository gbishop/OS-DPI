import { openDB } from "./_snowpack/pkg/idb/with-async-ittr.js";
import { zipSync, strToU8, unzipSync, strFromU8 } from "./_snowpack/pkg/fflate.js";
import { fileSave } from "./_snowpack/pkg/browser-fs-access.js";

class DB {
  constructor() {
    this.dbPromise = openDB("os-dpi", 3, {
      upgrade(db) {
        try {
          db.deleteObjectStore("store");
          db.deleteObjectStore("images");
          db.deleteObjectStore("saved");
          db.deleteObjectStore("url");
        } catch (e) {}
        let objectStore = db.createObjectStore("store", {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("by-name", "name");
        objectStore.createIndex("by-name-type", ["name", "type"]);
        db.createObjectStore("images", {
          keyPath: "name",
        });
        // keep track of the name and ETag (if any) of designs that have been saved
        let savedStore = db.createObjectStore("saved", {
          keyPath: "name",
        });
        savedStore.createIndex("by-etag", "etag");
        // track etags for urls
        db.createObjectStore("url", {
          keyPath: "url",
        });
      },
    });
    this.updateListeners = [];
    this.designName = "";
    this.fileName = "";
    this.fileHandle = null;
    this.fileVersion = 0.0;
    this.fileUid = "";
  }

  /** set the name for the current design
   * @param {string} name
   */
  setDesignName(name) {
    this.designName = name;
  }

  /** rename the design
   * @param {string} newName
   */
  async renameDesign(newName) {
    const db = await this.dbPromise;
    newName = await this.uniqueName(newName);
    const tx = db.transaction("store", "readwrite");
    const index = tx.store.index("by-name");
    for await (const cursor of index.iterate(this.designName)) {
      const record = { ...cursor.value };
      record.name = newName;
      cursor.update(record);
    }
    await tx.done;
    const stx = db.transaction("saved", "readwrite");
    const cursor = await stx.store.openCursor(this.designName);
    if (cursor) {
      const saved = cursor.value;
      cursor.delete();
      saved.name = newName;
      stx.store.put(saved);
    }
    await stx.done;

    this.notify({ action: "rename", name: this.designName, newName });
    this.designName = newName;
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

  /**
   * return list of names of saved designs in the db
   * @returns {Promise<string[]>}
   */
  async saved() {
    const db = await this.dbPromise;
    const result = [];
    for (const key of await db.getAllKeys("saved")) {
      result.push(key.toString());
    }
    return result;
  }

  /**
   * Create a unique name for new design
   * @param {string} name - the desired name
   * @returns {Promise<string>}
   */
  async uniqueName(name = "new") {
    // strip off any suffix
    name = name.replace(/\.osdpi$|\.zip$/, "");
    // strip any -number off the end of base
    name = name.replace(/-\d+$/, "") || name;
    // replace characters we don't want with _
    name = name.replaceAll(/[^a-zA-Z0-9]/g, "_");
    // replace multiple _ with one
    name = name.replaceAll(/_+/g, "_");
    // remove trailing _
    name = name.replace(/_+$/, "");
    // remove leading _
    name = name.replace(/^_+/, "");
    // if we're left with nothing the call it noname
    name = name || "noname";
    const allNames = await this.names();
    if (allNames.indexOf(name) < 0) return name;
    const base = name;
    for (let i = 1; true; i++) {
      const name = `${base}-${i}`;
      if (allNames.indexOf(name) < 0) return name;
    }
  }

  /** Return the most recent record for the type
   * @param {string} type
   * @param {any} defaultValue
   * @returns {Promise<Object>}
   */
  async read(type, defaultValue) {
    const db = await this.dbPromise;
    const index = db
      .transaction("store", "readonly")
      .store.index("by-name-type");
    const cursor = await index.openCursor([this.designName, type], "prev");
    return cursor?.value.data || defaultValue;
  }

  /** Add a new record
   * @param {string} type
   * @param {Object} data
   * @returns {Promise<IDBValidKey>}
   */
  async write(type, data) {
    const db = await this.dbPromise;
    const result = db.put("store", { name: this.designName, type, data });
    db.delete("saved", this.designName);
    this.notify({ action: "update", name: this.designName });
    return result;
  }

  /** Undo by deleting the most recent record
   * @param {string} type
   * @returns {Promise<Object>}
   */
  async undo(type) {
    const db = await this.dbPromise;
    const index = db
      .transaction("store", "readwrite")
      .store.index("by-name-type");
    const cursor = await index.openCursor([this.designName, type], "prev");
    if (cursor) await cursor.delete();
    db.delete("saved", this.designName);
    this.notify({ action: "update", name: this.designName });
    return this.read(type);
  }

  /** Read a design from a local file
   * @param {import("browser-fs-access").FileWithHandle} file
   */
  async readDesignFromFile(file) {
    // keep the handle so we can save to it later
    this.fileHandle = file.handle;
    return this.readDesignFromBlob(file, file.name);
  }

  /** Read a design from a URL
   * @param {string} url
   */
  async readDesignFromURL(url) {
    const db = await this.dbPromise;
    // have we seen this url before?
    const urlRecord = await db.get("url", url);
    /** @type {HeadersInit} */
    const headers = {}; // for the fetch
    let name = "";
    if (urlRecord) {
      /** @type {string} */
      const etag = urlRecord.etag;
      // do we have any saved designs with this etag?
      const savedKey = await db.getKeyFromIndex("saved", "by-etag", etag);
      if (savedKey) {
        // yes we have a previously saved design from this url
        // set the headers to check if it has changed
        headers["If-None-Match"] = etag;
        name = savedKey.toString();
      }
    }

    const response = await fetch(url, { headers });
    if (response.status == 304) {
      // we already have it
      console.log("no need to fetch, we have it", name);
      this.designName = name;
      return;
    }
    if (!response.ok) {
      throw new Error(`Fetching the URL (${url}) failed: ${response.status}`);
    }
    const etag = response.headers.get("ETag");
    db.put("url", { url, etag });

    const urlParts = new URL(url, window.location.origin);
    const pathParts = urlParts.pathname.split("/");
    if (
      pathParts.length > 0 &&
      pathParts[pathParts.length - 1].endsWith(".osdpi")
    ) {
      name = pathParts[pathParts.length - 1];
    } else {
      throw new Error(`Design files should have .osdpi suffix`);
    }

    const blob = await response.blob();
    // parse the URL
    return this.readDesignFromBlob(blob, name, etag);
  }

  /** Read a design from a zip file
   * @param {Blob} blob
   * @param {string} filename
   */
  async readDesignFromBlob(blob, filename, etag = "none") {
    const db = await this.dbPromise;
    this.fileName = filename;

    const zippedBuf = await readAsArrayBuffer(blob);
    const zippedArray = new Uint8Array(zippedBuf);
    const unzipped = unzipSync(zippedArray);

    // normalize the fileName to make the design name
    let name = this.fileName;
    // make sure it is unique
    name = await this.uniqueName(name);

    this.designName = name;

    for (const fname in unzipped) {
      if (fname.endsWith("json")) {
        const text = strFromU8(unzipped[fname]);
        const obj = JSON.parse(text);
        const type = fname.split(".")[0];
        await this.write(type, obj);
      } else if (fname.endsWith(".png") || fname.endsWith(".jpg")) {
        const blob = new Blob([unzipped[fname]], {
          type: `image/${fname.slice(-3)}`,
        });
        await db.put("images", {
          name: fname,
          content: blob,
        });
      }
    }
    await db.put("saved", { name: this.designName, etag });
    this.notify({ action: "update", name: this.designName });
    return;
  }

  /** Save a design into a zip file
   */
  async saveDesign() {
    const db = await this.dbPromise;

    // collect the parts of the design
    const layout = await this.read("layout");
    const actions = await this.read("actions");
    const content = await this.read("content");

    const zipargs = {
      "layout.json": strToU8(JSON.stringify(layout)),
      "actions.json": strToU8(JSON.stringify(actions)),
      "content.json": strToU8(JSON.stringify(content)),
    };

    // find all the image references in the content
    // there should be a better way
    const imageNames = new Set();
    for (const row of content) {
      if (row.symbol && row.symbol.indexOf("/") < 0) {
        imageNames.add(row.symbol);
      } else if (row.image && row.image.indexOf("/") < 0) {
        imageNames.add(row.image);
      }
    }

    // add the encoded image to the zipargs
    for (const imageName of imageNames) {
      const record = await db.get("images", imageName);
      if (record) {
        const contentBuf = await record.content.arrayBuffer();
        const contentArray = new Uint8Array(contentBuf);
        zipargs[imageName] = contentArray;
      }
    }

    // zip it
    const zip = zipSync(zipargs);
    // create a blob from the zipped result
    const blob = new Blob([zip], { type: "application/octet-stream" });
    const options = {
      fileName: this.fileName || this.designName + ".osdpi",
      extensions: [".osdpi", ".zip"],
      id: "osdpi",
    };
    await fileSave(blob, options, this.fileHandle);
    db.put("saved", { name: this.designName });
  }

  /** Unload a design from the database
   * @param {string} name - the name of the design to delete
   */
  async unload(name) {
    const db = await this.dbPromise;
    const tx = db.transaction("store", "readwrite");
    const index = tx.store.index("by-name");
    for await (const cursor of index.iterate(name)) {
      cursor.delete();
    }
    await tx.done;
    db.delete("saved", name);
  }

  /** Return an image from the database
   * @param {string} name
   * @returns {Promise<HTMLImageElement>}
   */
  async getImage(name) {
    const db = await this.dbPromise;
    const record = await db.get("images", name);
    const img = new Image();
    if (record) {
      img.src = URL.createObjectURL(record.content);
    }
    img.title = record.name;
    return img;
  }

  /** Return an image URL from the database
   * @param {string} name
   * @returns {Promise<string>}
   */
  async getImageURL(name) {
    const db = await this.dbPromise;
    const record = await db.get("images", name);
    if (record) return URL.createObjectURL(record.content);
    else return name;
  }

  /** Add an image to the database
   * @param {Blob} blob
   * @param {string} name
   */
  async addImage(blob, name) {
    const db = await this.dbPromise;
    return db.put("images", {
      name: name,
      content: blob,
    });
  }

  /** List image names
   * @returns {Promise<string[]>}
   * */
  async listImages() {
    const db = await this.dbPromise;
    const keys = await db.getAllKeys("images");
    const result = [];
    for (const key of keys) {
      result.push(key.toString());
    }
    return result;
  }

  /** Listen for database update
   * @param {(message: UpdateNotification) =>void} callback
   */
  addUpdateListener(callback) {
    this.updateListeners.push(callback);
  }

  /** Notify listeners of database update
   * @param {UpdateNotification} message
   */
  notify(message) {
    for (const listener of this.updateListeners) {
      listener(message);
    }
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
