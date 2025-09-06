import { openDB } from "idb";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import { fileSave } from "browser-fs-access";
import Globals from "./globals";

export class DB {
  constructor() {
    this.dbPromise = openDB("os-dpi", 6, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 6) {
          let logStore = db.createObjectStore("logstore", {
            keyPath: "id",
            autoIncrement: true,
          });
          logStore.createIndex("by-name", "name");
        }
        if (oldVersion < 5) {
          let store5 = db.createObjectStore("store5", {
            keyPath: ["name", "type"],
          });
          store5.createIndex("by-name", "name");
          if (oldVersion == 4) {
            // copy data from old store to new
            const store4 = transaction.objectStore("store");
            for await (const cursor of store4) {
              const record4 = cursor.value;
              store5.put(record4);
            }
            db.deleteObjectStore("store");
            // add an etag index to url store
            transaction.objectStore("url").createIndex("by-etag", "etag");
          } else if (oldVersion < 4) {
            db.createObjectStore("media");
            let savedStore = db.createObjectStore("saved", {
              keyPath: "name",
            });
            savedStore.createIndex("by-etag", "etag");
            // track etags for urls
            const urlStore = db.createObjectStore("url", {
              keyPath: "url",
            });
            // add an etag index to the url store
            urlStore.createIndex("by-etag", "etag");
          }
        }
      },
      blocked(currentVersion, blockedVersion, event) {
        console.log("blocked", { currentVersion, blockedVersion, event });
      },
      blocking(_currentVersion, _blockedVersion, _event) {
        window.location.reload();
      },
      terminated() {
        console.log("terminated");
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
    document.title = name;
  }

  /** rename the design
   * @param {string} newName
   */
  async renameDesign(newName) {
    const db = await this.dbPromise;
    newName = await this.uniqueName(newName);
    const tx = db.transaction(["store5", "media", "saved"], "readwrite");
    const index = tx.objectStore("store5").index("by-name");
    for await (const cursor of index.iterate(this.designName)) {
      const record = { ...cursor.value, name: newName };
      cursor.delete();
      tx.objectStore("store5").put(record);
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
    const keys = await db.getAllKeysFromIndex("store5", "by-name");
    const result = [...new Set(keys.map((key) => key.valueOf()[0]))];
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
    for (let i = 1; ; i++) {
      const name = `${base}-${i}`;
      if (allNames.indexOf(name) < 0) return name;
    }
  }

  /** Return the record for type or the defaultValue
   * @param {string} type
   * @param {any} defaultValue
   * @returns {Promise<Object>}
   */
  async read(type, defaultValue = {}) {
    const db = await this.dbPromise;
    const record = await db.get("store5", [this.designName, type]);
    let data = record ? record.data : defaultValue;
    data = JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (typeof value === "string") {
          return value.normalize("NFC"); // Use NFC normalization form
        }
        return value;
      }),
    );

    return data;
  }

  /**
   * Read log records
   *
   * @returns {Promise<Object[]>}
   */
  async readLog() {
    const db = await this.dbPromise;
    const index = db.transaction("logstore", "readonly").store.index("by-name");
    const key = this.designName;
    const result = [];
    for await (const cursor of index.iterate(key)) {
      const data = cursor.value.data;
      result.push(data);
    }
    return result;
  }

  /** Write a design record
   * @param {string} type
   * @param {Object} data
   */
  async write(type, data) {
    const db = await this.dbPromise;
    // normalize the data for unicode issues
    data = JSON.parse(
      JSON.stringify(data, (_key, value) => {
        if (typeof value === "string") {
          return value.normalize("NFC"); // Use NFC normalization form
        }
        return value;
      }),
    );

    // do all this in a transaction
    const tx = db.transaction(["store5", "saved"], "readwrite");
    // note that this design has been updated
    await tx.objectStore("saved").delete(this.designName);
    // add the record to the store
    const store = tx.objectStore("store5");
    await store.put({ name: this.designName, type, data });
    await tx.done;

    this.notify({ action: "update", name: this.designName });
  }

  /** Write a log record
   * @param {Object} data
   */
  async writeLog(data) {
    const db = await this.dbPromise;
    const tx = db.transaction(["logstore"], "readwrite");
    tx.objectStore("logstore").put({ name: this.designName, data });
    await tx.done;
  }

  /**
   * delete records of this type
   *
   * @param {string} type
   * @returns {Promise<void>}
   */
  async clear(type) {
    const db = await this.dbPromise;
    return db.delete("store5", [this.designName, type]);
  }

  /**
   * delete log records
   *
   * @returns {Promise<void>}
   */
  async clearLog() {
    const db = await this.dbPromise;
    const tx = db.transaction("logstore", "readwrite");
    const index = tx.store.index("by-name");
    for await (const cursor of index.iterate(this.designName)) {
      cursor.delete();
    }
    await tx.done;
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
   * @param {string} [name]
   * @returns {Promise<boolean>}
   */
  async readDesignFromURL(url, name = "") {
    if (!url) return false;
    let design_url = url;
    /** @type {Response} */
    let response;
    const db = await this.dbPromise;

    // a local URL
    if (!url.startsWith("http")) {
      response = await fetch(url);
    } else {
      // allow for the url to point to HTML that contains the link
      if (!url.match(/.*\.(osdpi|zip)$/)) {
        response = await fetch("https://gb.cs.unc.edu/cors/", {
          headers: { "Target-URL": url },
        });
        if (!response.ok) {
          throw new Error(
            `Fetching the URL (${url}) failed: ${response.status}`,
          );
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // find the first link that matches the name
        const link =
          doc.querySelector(`a[href$="${name}.zip"]`) ||
          doc.querySelector(`a[href$="${name}.osdpi"]`);
        if (link instanceof HTMLAnchorElement) {
          design_url = link.href;
        } else {
          throw new Error(`Invalid URL ${url}`);
        }
      }
      // have we seen this url before?
      const urlRecord = await db.get("url", design_url);
      /** @type {HeadersInit} */
      const headers = {}; // for the fetch
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
      headers["Target-URL"] = design_url;

      response = await fetch("https://gb.cs.unc.edu/cors/", { headers });
    }
    if (response.status == 304) {
      // we already have it
      this.designName = name;
      return false;
    }
    if (!response.ok) {
      throw new Error(`Fetching the URL (${url}) failed: ${response.status}`);
    }

    const etag = response.headers.get("ETag") || "";
    await db.put("url", { url: design_url, page_url: url, etag });

    if (!name) {
      const urlParts = new URL(design_url, window.location.origin);
      const pathParts = urlParts.pathname.split("/");
      if (
        pathParts.length > 0 &&
        (pathParts[pathParts.length - 1].endsWith(".osdpi") ||
          pathParts[pathParts.length - 1].endsWith(".zip"))
      ) {
        name = pathParts[pathParts.length - 1];
      } else {
        throw new Error(`Design files should have .osdpi suffix`);
      }
    }

    const blob = await response.blob();

    // parse the URL
    return this.readDesignFromBlob(blob, name, etag);
  }

  /** Return the URL (if any) this design was imported from
   * @returns {Promise<string>}
   */
  async getDesignURL() {
    const db = await this.dbPromise;

    const name = this.designName;

    // check saved
    const savedRecord = await db.get("saved", name);
    if (savedRecord && savedRecord.etag && savedRecord.etag != "none") {
      // lookup the URL
      const etag = savedRecord.etag;
      const urlRecord = await db.getFromIndex("url", "by-etag", etag);
      if (urlRecord) {
        const url = urlRecord.page_url;
        return url;
      }
    }
    return "";
  }

  /**
   * Reload the design from a URL if and only if:
   * 1. It was loaded from a URL
   * 2. It has not been edited
   * 3. The ETag has changed
   */
  async reloadDesignFromOriginalURL() {
    const url = await this.getDesignURL();
    if (url) {
      if (await this.readDesignFromURL(url)) {
        Globals.restart();
      }
    }
  }

  /** Read design from the blob
   * @param {Blob} blob
   * @param {string} filename
   * @param {string} etag
   * @returns {Promise<boolean>}
   */
  async readDesignFromBlob(blob, filename, etag = "") {
    const db = await this.dbPromise;
    this.fileName = filename;

    // normalize the fileName to make the design name
    let name = this.fileName;
    // make sure it is unique
    if (!etag) {
      name = await this.uniqueName(name);
    } else {
      name = name.replace(/\.(zip|osdpi)$/, "");
    }

    this.designName = name;

    const design = await unPackDesign(blob);
    // copy the design into the db
    for (const [key, value] of Object.entries(design)) {
      if (key == "media" && design.media) {
        for (const media of design.media) {
          await this.addMedia(media.content, media.name);
        }
      } else {
        await this.write(key, value);
      }
    }

    await db.put("saved", { name: this.designName, etag });
    this.notify({ action: "update", name: this.designName });
    return true;
  }

  // do this part async to avoid file picker timeout
  /**
   * Converts the current design data into a Blob object containing a zipped archive.
   * The archive includes layout, actions, content, method, pattern, cues, and associated media files.
   *
   * @async
   * @function convertDesignToBlob
   * @returns {Promise<Blob>} A Promise that resolves with a Blob object representing the zipped design data.
   * @throws {Error} Will throw an error if database operations fail or if zipping encounters an issue.
   */
  async convertDesignToBlob() {
    const db = await this.dbPromise;
    // collect the parts of the design
    const layout = Globals.layout.toObject();
    const actions = Globals.actions.toObject();
    const content = await this.read("content");
    const method = Globals.methods.toObject();
    const pattern = Globals.patterns.toObject();
    const cues = Globals.cues.toObject();

    const zipargs = {
      "layout.json": strToU8(JSON.stringify(layout)),
      "actions.json": strToU8(JSON.stringify(actions)),
      "content.json": strToU8(JSON.stringify(content)),
      "method.json": strToU8(JSON.stringify(method)),
      "pattern.json": strToU8(JSON.stringify(pattern)),
      "cues.json": strToU8(JSON.stringify(cues)),
    };

    const mediaKeys = (await db.getAllKeys("media")).filter((pair) =>
      Object.values(pair).includes(this.designName),
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
    const blob = new Blob([new Uint8Array(zip)], {
      type: "application/octet-stream",
    });
    return blob;
  }

  /**
   * Saves the current design as a .osdpi or .zip file using the fileSave library.
   * The design is first converted into a Blob object containing a zipped archive,
   * then saved to the user's file system.  Also saves the design name in the "saved" table of the db.
   *
   * @async
   * @function saveDesign
   * @returns {Promise<void>} A Promise that resolves when the design is successfully saved.
   * @throws {Error} Logs an error to the console if the export fails.
   */
  async saveDesign() {
    const db = await this.dbPromise;

    const options = {
      fileName: this.fileName || this.designName + ".osdpi",
      extensions: [".osdpi", ".zip"],
      id: "osdpi",
    };
    try {
      await fileSave(this.convertDesignToBlob(), options, this.fileHandle);
      await db.put("saved", { name: this.designName });
    } catch (error) {
      console.error("Export failed");
      console.error(error);
    }
  }

  /** Unload a design from the database
   * @param {string} name - the name of the design to delete
   */
  async unload(name) {
    const db = await this.dbPromise;
    const tx = db.transaction("store5", "readwrite");
    const index = tx.store.index("by-name");
    for await (const cursor of index.iterate(name)) {
      cursor.delete();
    }
    await tx.done;
    // delete media
    const txm = db.transaction("media", "readwrite");
    const mediaKeys = (await txm.store.getAllKeys()).filter(
      (pair) => Object.values(pair)[0] == name,
    );

    // delete the media
    for (const key of mediaKeys) {
      await txm.store.delete(key);
    }
    await txm.done;
    await db.delete("saved", name);
    this.notify({ action: "unload", name });
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

  /** Return an image blob from the database
   * @param {string} name
   * @returns {Promise<Blob>}
   */
  async getImageBlob(name) {
    const db = await this.dbPromise;
    const record = await db.get("media", [this.designName, name]);
    return record.content;
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
    name = name.normalize("NFC");
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
    name = name.normalize("NFC");
    return await db.put(
      "media",
      {
        name: name,
        content: blob,
      },
      [this.designName, name],
    );
  }

  /** List media entries from a given store
   * @returns {Promise<string[]>}
   * */
  async listMedia() {
    const db = await this.dbPromise;
    const keys = (await db.getAllKeys("media")).filter(
      (key) => key[0] == this.designName, //only show resources from this design
    );
    const result = [];
    for (const key of keys) {
      result.push(key[1].toString());
    }
    return result;
  }

  /** delete media files
   * @param {string[]} names
   */
  async deleteMedia(...names) {
    const db = await this.dbPromise;
    const tx = db.transaction(["media", "saved"], "readwrite");
    const mst = tx.objectStore("media");
    for await (const cursor of mst.iterate()) {
      if (
        cursor &&
        cursor.key[0] == this.designName &&
        names.includes(cursor.key[1])
      ) {
        cursor.delete();
      }
    }
    const cursor = await tx.objectStore("saved").openCursor(this.designName);
    if (cursor) {
      cursor.delete();
    }
    await tx.done;
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

/** Unpack a design from a blob
 *
 * @param {Blob} blob
 * @returns {Promise<DesignObject>}
 */
export async function unPackDesign(blob) {
  const zippedBuf = await readAsArrayBuffer(blob);
  const zippedArray = new Uint8Array(zippedBuf);
  const unzipped = unzipSync(zippedArray);

  /** @type {DesignObject} */
  const result = {};
  const media = [];
  for (const fname in unzipped) {
    const mimetype = mime(fname) || "application/octet-stream";
    if (mimetype == "application/json") {
      const text = strFromU8(unzipped[fname]);
      let obj = {};
      try {
        obj = JSON.parse(text);
        let type = fname.split(".")[0];
        result[type] = obj;
      } catch (e) {
        console.trace(e);
      }
    } else if (
      mimetype.startsWith("image") ||
      mimetype.startsWith("audio") ||
      mimetype.startsWith("video")
    ) {
      const blob = new Blob([new Uint8Array(unzipped[fname])], {
        type: mimetype,
      });
      media.push({ name: fname, content: blob });
    }
  }
  if (media.length > 0) {
    result.media = media;
  }
  return result;
}

const mimetypes = {
  ".json": "application/json",
  ".aac": "audio/aac",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".oga": "audio/ogg",
  ".wav": "audio/wav",
  ".weba": "audio/webm",
  ".webm": "video/webm",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".jfif": "image/jpeg",
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
