import { openDB } from "idb/with-async-ittr";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import { fileOpen, fileSave } from "browser-fs-access";

class DB {
  constructor() {
    this.dbPromise = openDB("os-dpi", 2, {
      upgrade(db, oldVersion, newVersion) {
        console.log(oldVersion, newVersion);
        if (oldVersion < 1) {
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
        }
        if (oldVersion < 2) {
          // keep track of the id of records that have been saved
          db.createObjectStore("saved", {
            keyPath: "name",
          });
        }
      },
    });
    this.updateListeners = [];
    this.designName = "";
    this.fileName = "";
    this.fileHandle = null;
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
    console.log("rename", newName, this.designName);
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
    this.notify({ action: "rename", name: this.designName, newName });
    this.designName = newName;
    window.location.hash = newName;
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
    console.log({ type, cursor });
    if (cursor) await cursor.delete();
    db.delete("saved", this.designName);
    this.notify({ action: "update", name: this.designName });
    return this.read(type);
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
    const db = await this.dbPromise;
    // keep the handle so we can save to it later
    this.fileHandle = blob.handle;
    this.fileName = blob.name;
    // normalize the fileName to make the design name
    let name = this.fileName;
    // strip off the suffix
    name = name.substring(0, name.lastIndexOf("."));
    // make sure it is unique
    name = await this.uniqueName(name);

    this.designName = name;

    // load the new one
    const zippedBuf = await readAsArrayBuffer(blob);
    const zippedArray = new Uint8Array(zippedBuf);
    const unzipped = unzipSync(zippedArray);
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
    db.put("saved", { name: this.designName });
    this.notify({ action: "update", name: this.designName });
    window.location.hash = this.designName;
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
      const record = await db.getFromIndex("images", "by-name", imageName);
      if (record) {
        const contentBuf = await record.content.arrayBuffer();
        const contentArray = new Uint8Array(contentBuf);
        zipargs[imageName] = contentArray;
      }
    }
    console.log("image names", imageNames);

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
    console.log("saved file");
  }

  /** Delete a design from the database
   * @param {string} name - the name of the design to delete
   */
  async delete(name) {
    const db = await this.dbPromise;
    const tx = db.transaction("store", "readwrite");
    const index = tx.store.index("by-name");
    for await (const cursor of index.iterate(name)) {
      cursor.delete();
    }
    await tx.done;
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
    if (record) return URL.createObjectURL(record.content);
    else return name;
  }

  /** Add an image to the database
   * @param {Blob} blob
   * @param {string} name
   */
  async addImage(blob, name) {
    const db = await this.dbPromise;
    const h = await hash(blob);
    const test = await db.get("images", h);
    if (test) {
      console.log(name, "is dup");
    } else {
      await db.put("images", {
        name: name,
        content: blob,
        hash: h,
      });
    }
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

/** Compute the hash of a blob for de-duping the database
 * @param {Blob} blob */
async function hash(blob) {
  const buf = await readAsArrayBuffer(blob);
  return crypto.subtle.digest("SHA-256", buf);
}
