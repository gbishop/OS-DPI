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
    console.log("in content");
    const data = this.context.data;
    /**
     * A reference to the error messages div
     * @type {{current: HTMLInputElement}} */
    const refMessages = { current: null };
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
        onkeydown=${async (/** @type {KeyboardEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          if (target.checkValidity() && e.key == "Enter") {
            const urlEnd = target.value.indexOf("/edit");
            try {
              if (urlEnd < 0) throw new Error("Invalid Google Sheets URL");
              const sheetURL =
                target.value.slice(0, urlEnd) +
                "/gviz/tq?tqx=out:csv&tq=SELECT *";
              const response = await fetch(sheetURL);
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
