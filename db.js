import { openDB } from "idb/with-async-ittr";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import { fileSave } from "browser-fs-access";
import Globals from "./globals";

const N_RECORDS_SAVE = 10;
const N_RECORDS_MAX = 20;

export class DB {
  constructor() {
    this.dbPromise = openDB("os-dpi", 4, {
      upgrade(db, oldVersion, newVersion) {
        if (oldVersion < 3) {
          for (const name of ["store", "media", "saved", "url"]) {
            try {
              db.deleteObjectStore(name);
            } catch (e) {}
          }
        } else if (oldVersion == 3) {
          db.deleteObjectStore("images");
        }
        if (oldVersion < 3) {
          let objectStore = db.createObjectStore("store", {
            keyPath: "id",
            autoIncrement: true,
          });
          objectStore.createIndex("by-name", "name");
          objectStore.createIndex("by-name-type", ["name", "type"]);
        }
        if (newVersion >= 4) {
          db.createObjectStore("media");
        }
        if (oldVersion < 3) {
          // keep track of the name and ETag (if any) of designs that have been saved
          let savedStore = db.createObjectStore("saved", {
            keyPath: "name",
          });
          savedStore.createIndex("by-etag", "etag");
          // track etags for urls
          db.createObjectStore("url", {
            keyPath: "url",
          });
        }
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
    const tx = db.transaction(["store", "media", "saved"], "readwrite");
    const index = tx.objectStore("store").index("by-name");
    for await (const cursor of index.iterate(this.designName)) {
      const record = { ...cursor.value };
      record.name = newName;
      cursor.update(record);
    }
    const mst = tx.objectStore("media");
    for await (const cursor of mst.iterate()) {
      if (cursor && cursor.key[0] == this.designName) {
        const record = { ...cursor.value };
        const key = cursor.key;
        cursor.delete();
        key[0] = newName;
        mst.put(record, key);
      }
    }
    const cursor = await tx.objectStore("saved").openCursor(this.designName);
    if (cursor) {
      cursor.delete();
    }
    await tx.done;
    this.fileHandle = null;
    this.fileName = "";

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
    if (cursor) {
      const data = cursor.value.data;
      if (typeof data == "string") {
        return defaultValue;
      }
      return data;
    }
    return defaultValue;
  }

  /** Add a new record
   * @param {string} type
   * @param {Object} data
   */
  async write(type, data) {
    console.trace("write", type, data);
    const db = await this.dbPromise;
    // do all this in a transaction
    const tx = db.transaction(["store", "saved"], "readwrite");
    // note that this design has been updated
    await tx.objectStore("saved").delete(this.designName);
    // add the record to the store
    const store = tx.objectStore("store");
    await store.put({ name: this.designName, type, data });

    // only keep one of the content
    const [n_max, n_save] =
      type == "content" ? [1, 1] : [N_RECORDS_MAX, N_RECORDS_SAVE];

    /* Only keep the last few records per type */
    const index = store.index("by-name-type");
    const key = [this.designName, type];
    // count how many we have
    let count = await index.count(key);
    if (count > n_max) {
      // get the number to delete
      let toDelete = count - n_save;
      // we're getting them in order so this will delete the oldest ones
      for await (const cursor of index.iterate(key)) {
        if (--toDelete <= 0) break;
        cursor.delete();
      }
    }
    await tx.done;

    this.notify({ action: "update", name: this.designName });
  }

  /**
   * delete records of this type
   *
   * @param {string} type
   * @returns {Promise<void>}
   */
  async clear(type) {
    const db = await this.dbPromise;
    const tx = db.transaction("store", "readwrite");
    const index = tx.store.index("by-name-type");
    for await (const cursor of index.iterate([this.designName, type])) {
      cursor.delete();
    }
    await tx.done;
  }

  /** Undo by deleting the most recent record
   * @param {string} type
   */
  async undo(type) {
    if (type == "content") return;
    const db = await this.dbPromise;
    const index = db
      .transaction("store", "readwrite")
      .store.index("by-name-type");
    const cursor = await index.openCursor([this.designName, type], "prev");
    if (cursor) await cursor.delete();
    await db.delete("saved", this.designName);
    this.notify({ action: "update", name: this.designName });
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
    await db.put("url", { url, etag });

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
      const mimetype = mime(fname) || "application/octet-stream";
      if (mimetype == "application/json") {
        const text = strFromU8(unzipped[fname]);
        let obj = {};
        try {
          obj = JSON.parse(text);
        } catch (e) {
          obj = {};
          console.trace(e);
        }
        const type = fname.split(".")[0];
        await this.write(type, obj);
      } else if (mimetype.startsWith("image") || mimetype.startsWith("audio")) {
        const blob = new Blob([unzipped[fname]], {
          type: mimetype,
        });
        await db.put(
          "media",
          {
            name: fname,
            content: blob,
          },
          [name, fname]
        );
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
    const layout = Globals.tree.toObject(false);
    const actions = Globals.actions.toObject(false);
    const content = await this.read("content");
    const method = Globals.method.toObject(false);
    const pattern = Globals.patterns.toObject(false);
    const cues = Globals.cues.toObject(false);

    const zipargs = {
      "layout.json": strToU8(JSON.stringify(layout)),
      "actions.json": strToU8(JSON.stringify(actions)),
      "content.json": strToU8(JSON.stringify(content)),
      "method.json": strToU8(JSON.stringify(method)),
      "pattern.json": strToU8(JSON.stringify(pattern)),
      "cues.json": strToU8(JSON.stringify(cues)),
    };

    const mediaKeys = (await db.getAllKeys("media")).filter((pair) =>
      Object.values(pair).includes(this.designName)
    );

    // add the encoded image to the zipargs
    for (const key of mediaKeys) {
      const record = await db.get("media", key);
      if (record) {
        const contentBuf = await record.content.arrayBuffer();
        const contentArray = new Uint8Array(contentBuf);
        zipargs[key[1]] = contentArray;
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
    await db.put("saved", { name: this.designName });
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
    await db.delete("saved", name);
  }

  /** Return an image from the database
   * @param {string} name
   * @returns {Promise<HTMLImageElement>}
   */
  async getImage(name) {
    const db = await this.dbPromise;
    const record = await db.get("media", [this.designName, name]);
    const img = new Image();
    if (record) {
      img.src = URL.createObjectURL(record.content);
    }
    img.title = record.name;
    return img;
  }

  /** Return an audio file from the database
   * @param {string} name
   * @returns {Promise<HTMLAudioElement>}
   */
  async getAudio(name) {
    const db = await this.dbPromise;
    const record = await db.get("media", [this.designName, name]);
    const audio = new Audio();
    if (record) {
      audio.src = URL.createObjectURL(record.content);
    }
    return audio;
  }

  /** Return an image URL from the database
   * @param {string} name
   * @returns {Promise<string>}
   */
  async getMediaURL(name) {
    const db = await this.dbPromise;
    const record = await db.get("media", [this.designName, name]);
    if (record) return URL.createObjectURL(record.content);
    else return "";
  }

  /** Add media to the database
   * @param {Blob} blob
   * @param {string} name
   */
  async addMedia(blob, name) {
    const db = await this.dbPromise;
    return await db.put(
      "media",
      {
        name: name,
        content: blob,
      },
      [this.designName, name]
    );
  }

  /** List media entries from a given store
   * @returns {Promise<string[]>}
   * */
  async listMedia() {
    const db = await this.dbPromise;
    const keys = (await db.getAllKeys("media")).filter(
      (key) => key[0] == this.designName //only show resources from this design
    );
    const result = [];
    for (const key of keys) {
      result.push(key[1].toString());
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

const mimetypes = {
  ".json": "application/json",
  ".aac": "audio/aac",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".oga": "audio/ogg",
  ".wav": "audio/wav",
  ".weba": "audio/webm",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};
/** Map filenames to mimetypes for unpacking the zip file
 * @param {string} fname
 */
function mime(fname) {
  const extension = /\.[-a-zA-Z0-9]+$/.exec(fname);
  if (!extension) return false;
  return mimetypes[extension] || false;
}
