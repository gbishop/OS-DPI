import { html, render } from "uhtml";
import { Base } from "./base";
import db from "../db";
import { Data } from "../data";
import { fileOpen } from "browser-fs-access";
import XLSX from "xlsx";
import css from "ustyler";
import pleaseWait from "./wait";

/** @param {Blob} blob */
async function readSheetFromBlob(blob) {
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data, {codepage: 65001});
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const names = [];
  const handlers = [];
  const validColumns = [];
  // process the header and choose a handler for each column
  for (let c = range.s.c; c <= range.e.c; c++) {
    let columnName = sheet[XLSX.utils.encode_cell({ r: 0, c })]?.v;
    if (typeof columnName !== "string" || !columnName) {
      continue;
    }
    columnName = columnName.toLowerCase();
    names.push(columnName);
    validColumns.push(c);
    switch (columnName) {
      case "row":
      case "column":
      case "page":
        handlers.push("number");
        break;
      default:
        if (columnName.startsWith("tag")) {
          handlers.push("tag");
        } else {
          handlers.push("string");
        }
        break;
    }
  }
  // Process the rows
  /** @type {Rows} */
  const dataArray = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    /** @type {Row} */
    const row = { tags: [] };
    for (let i = 0; i < validColumns.length; i++) {
      /** @type {string} */
      const name = names[i];
      const c = validColumns[i];
      let value = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
      switch (handlers[i]) {
        case "string":
          if (typeof value === "number") {
            value = value.toString(10);
          }
          if (value && typeof value === "string") {
            row[name] = value;
          }
          break;
        case "tag":
          if (typeof value === "number") {
            value = value.toString(10);
          }
          if (value && typeof value === "string") {
            row.tags.push(value);
          } else {
            row.tags.push("");
          }

          break;
        case "number":
          if (typeof value === "number") {
            row[name] = Math.floor(value);
          } else if (value && typeof value === "string") {
            value = parseInt(value, 10);
            if (isNaN(value)) {
              value = 0;
            }
            row[name] = value;
          }
          break;
      }
    }
    if (row.tags.length > 0 || Object.keys(row).length > 1) dataArray.push(row);
  }
  return dataArray;
}

export class Content extends Base {
  init() {
    this.sheetHandle = null;
    this.sheetMessage = "";
  }
  template() {
    const data = this.context.data;
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
          // clear messages
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
          pleaseWait(
            (async () => {
              const response = await fetch(URL);
              if (!response.ok)
                throw new Error(`Fetching the URL failed: ${response.status}`);
              const blob = await response.blob();
              var result = await readSheetFromBlob(blob);
              await db.write("content", result);
              this.context.data = new Data(result);
              this.context.state.update();
            })()
          );
        }}
      >
        <label for="remoteFileInput">URL: </label>
        <input
          id="remoteFileInput"
          name="url"
          type="url"
          placeholder="Enter a URL"
        />
        <input type="submit" value="Load remote sheet" />
      </form>
      <br />
      <button
        onclick=${async () => {
          this.sheetMessage = "";
          try {
            const blob = await fileOpen({
              extensions: [".csv", ".tsv", ".ods", ".xls", ".xlsx"],
              description: "Spreadsheets",
              id: "os-dpi",
            });
            if (blob) {
              this.sheetHandle = blob.handle;
              const result = await pleaseWait(readSheetFromBlob(blob));
              await db.write("content", result);
              this.sheetMessage = `Loaded ${blob.name}`;
              this.context.data = new Data(result);
              this.context.state.update();
            }
          } catch (e) {
            this.sheetHandle = null;
          }
        }}
      >
        Load local sheet
      </button>
      <button
        ?disabled=${!this.sheetHandle}
        onclick=${async () => {
          // @ts-ignore
          const blob = await this.sheetHandle.getFile();
          const result = await pleaseWait(readSheetFromBlob(blob));
          await db.write("content", result);
          this.sheetMessage = `Reloaded ${blob.name}`;
          this.context.data = new Data(result);
          this.context.state.update();
        }}
      >
        Reload local sheet
      </button>
      <span>${this.sheetMessage}</span>
      <h2>Load images</h2>
      <label for="images">Upload images: </label>
      <input
        id="images"
        type="file"
        multiple
        accept=".png,.jpg"
        onchange=${async (/** @type {InputEventWithTarget} */ event) => {
          const input = /** @type {HTMLInputElement} */ (event.currentTarget);
          if (!input || !input.files || !input.files.length) {
            return;
          }
          for (const file of input.files) {
            if (file && file.type.startsWith("image/")) {
              await db.addImage(file, file.name);
              // ask any live images with this name to refresh
              for (const img of document.querySelectorAll(
                `img[dbsrc="${file.name}"]`
              )) {
                /** @type {ImgDb} */ (img).refresh();
              }
            }
          }
          this.context.state.update();
        }}
      />
      <h2>Currently loaded images</h2>
      <ol style="column-count: 3">
        ${(/** @type {HTMLElement} */ comment) => {
          /* I'm experimenting here. db.listImages() is asynchronous but I don't want
           * to convert this entire application to the async version of uhtml. Can I
           * inject content asynchronously using the callback mechanism he provides?
           * As I understand it, when an interpolation is a function he places a
           * comment node in the output and passes it to the function.
           * I am using the comment node to find the parent container, then rendering
           * the asynchronous content when it becomes available being careful to keep
           * the comment node in the output. It seems to work, is it safe?
           */
          db.listImages().then((names) => {
            const list = names.map((name) => html`<li>${name}</li>`);
            render(comment.parentNode, html`${comment}${list}`);
          });
        }}
      </ol>
    </div>`;
  }
}

css`
  .content form {
    display: flex;
    width: 100%;
    gap: 0.5em;
  }

  .content form input[type="url"] {
    flex: 1;
    max-width: 60%;
  }

  .content div#messages {
    color: red;
    font-size: 2em;
    padding-left: 1em;
    padding-top: 1em;
  }
`;
