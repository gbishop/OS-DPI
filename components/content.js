import { html } from "uhtml";
import { Base } from "./base";
import db from "../db";
import { Data } from "../data";
import XLSX from "xlsx";
import sheetrock from "sheetrock";

/** @param {File} file */
async function readLocalSheet(file) {
  const data = await file.arrayBuffer();
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
    const tags = [];
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
    row["tags"] = tags;
    dataArray.push(row);
  }
  return dataArray;
}

async function readGoogleSheet(url) {
  return new Promise((resolve, reject) => {
    sheetrock({
      url,
      target: document.createElement("div"),
      callback: async (
        /** @type {object} error */ error,
        /** @type {object} options */ options,
        /** @type {object} response */ response
      ) => {
        console.log({ error, options, response });
        const header = response.rows[0].labels;
        const dataArray = [];
        for (let r = 1; r < response.rows.length; r++) {
          /** @type {Row} */
          const row = { tags: [] };
          const tags = row.tags;
          for (let c = 0; c < header.length; c++) {
            const name = header[c];
            if (!name) continue;
            const value = response.rows[r].cellsArray[c];
            if (!value) continue;
            if (name.startsWith("tags")) {
              tags.push(value);
            } else {
              row[name] = value;
            }
          }
          dataArray.push(row);
        }

        resolve(dataArray);
      },
    });
  });
}

export class Content extends Base {
  template() {
    const data = this.context.data;
    return html`<div class="content">
      <h1>Content</h1>
      <p>
        ${data.allrows.length} rows with these fields:
        ${String(data.allFields).replaceAll(",", ", ")}
      </p>
      <label for="remoteFileInput">Load a Google Sheets spreadsheet: </label>
      <input
        id="remoteFileInput"
        type="url"
        required="true"
        aria-required="true"
        onkeydown=${async (/** @type {KeyboardEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          if (target.checkValidity() && e.key == "Enter") {
            const result = await readGoogleSheet(target.value);
            this.context.data = new Data(result);
            this.context.state.update();
          }
        }}
      />
      <br />
      <label for="localFileInput">Load a local spreadsheet: </label>
      <input
        id="localFileInput"
        type="file"
        onchange=${async (/** @type {InputEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          const result = await readLocalSheet(target.files[0]);
          this.context.data = new Data(result);
          this.context.state.update();
        }}
      />
    </div>`;
  }
}
