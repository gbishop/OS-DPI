import { html } from "uhtml";
import { Base } from "./base";
import db from "../db";
import { Data } from "../data";
import XLSX from "xlsx";

/** @param {Blob} blob */
async function readSheetFromBlob(blob) {
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    header.push(sheet[XLSX.utils.encode_cell({ r: 0, c })]?.v);
  }
  /** @type {Rows} */
  const dataArray = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    /** @type {Row} */
    const row = { tags: [] };
    const tags = row.tags;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const name = header[c];
      if (!name) continue;
      const value = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
      if (!value) continue;
      if (name.startsWith("tags")) {
        tags.push(value);
      } else {
        row[name] = value;
      }
    }
    if (row.tags.length > 0 || Object.keys(row).length > 1) dataArray.push(row);
  }
  return dataArray;
}

export class Content extends Base {
  template() {
    const data = this.context.data;
    /**
     * A reference to the error messages div
     * @type {{current: HTMLInputElement}} */
    const refMessages = { current: null };
    /**
     * A reference to the load button so I can enabled when the url is valid
     * @type {{current: HTMLInputElement}} */
    return html`<div class="content">
      <h1>Content</h1>
      <p>
        ${data.allrows.length} rows with these fields:
        ${String(data.allFields).replaceAll(",", ", ")}
      </p>
      <h2>Load content from spreadsheets</h2>
      <form
        onsubmit=${(/** @type {SubmitEvent} */ e) => {
          e.preventDefault();
          console.log("submit", e);
          const form = e.target;
          /** @type {string} */
          let URL = form[0].value;
          if (URL.length === 0) return;
          // check for a Google Sheets URL
          if (
            URL.match(/https:\/\/docs.google.com\/spreadsheets\/.*\/edit.*/)
          ) {
            // hack Google Sheets URL to use the gviz interface
            URL = URL.replace(/\/edit.*$/, "/gviz/tq?tqx=out:csv&tq=SELECT *");
          }
          // do this part asynchronously
          (async () => {
            try {
              const response = await fetch(URL);
              if (!response.ok)
                throw new Error(`Fetching the URL failed: ${response.status}`);
              const blob = await response.blob();
              var result = await readSheetFromBlob(blob);
            } catch (e) {
              refMessages.current.innerHTML = e.message;
              return;
            }
            await db.write("content", result);
            this.context.data = new Data(result);
            this.context.state.update();
          })();
        }}
      >
        <label for="remoteFileInput">URL: </label>
        <input id="remoteFileInput" name="url" type="url" />
        <input type="submit" value="Load" />
      </form>
      <br />
      <label for="localFileInput">Local: </label>
      <input
        id="localFileInput"
        type="file"
        onchange=${async (/** @type {InputEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          try {
            var result = await readSheetFromBlob(target.files[0]);
          } catch (e) {
            refMessages.current.innerHTML = e.message;
            return;
          }
          await db.write("content", result);
          this.context.data = new Data(result);
          this.context.state.update();
        }}
      />
      <div id="messages" ref=${refMessages}></div>
    </div>`;
  }
}
