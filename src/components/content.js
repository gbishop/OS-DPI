import { html, render } from "uhtml";
import { TreeBase } from "./treebase";
import { DesignerPanel } from "./designer";
import * as Props from "./props";
import db from "app/db";
import "css/content.css";
import pleaseWait from "./wait";
import Globals from "app/globals";

/** @param {Blob} blob */
export async function readSheetFromBlob(blob) {
  const XLSX = await import("xlsx");
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data, { codepage: 65001 });
  /** @type {Rows} */
  const dataArray = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const ref = sheet["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
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
      names.push(columnName.trim(" "));
      validColumns.push(c);
      switch (columnName) {
        case "row":
        case "column":
        case "page":
          handlers.push("number");
          break;
        default:
          handlers.push("string");
          break;
      }
    }
    // Process the rows
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      /** @type {Row} */
      const row = { sheetName };
      for (let i = 0; i < validColumns.length; i++) {
        /** @type {string} */
        const name = names[i];
        const c = validColumns[i];
        let value = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
        switch (handlers[i]) {
          case "string":
            if (typeof value === "undefined") {
              value = "";
            }
            if (typeof value !== "string") {
              value = value.toString(10);
            }
            if (value && typeof value === "string") {
              row[name] = value;
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
      if (Object.keys(row).length > 1) dataArray.push(row);
    }
  }
  return dataArray;
}

/** Save the content as a spreadsheet
 * @param {string} name
 * @param {Row[]} rows
 * @param {string} type
 */
export async function saveContent(name, rows, type) {
  const XLSX = await pleaseWait(import("xlsx"));
  const sheetNames = new Set(rows.map((row) => row.sheetName || "sheet1"));
  const workbook = XLSX.utils.book_new();
  for (const sheetName of sheetNames) {
    let sheetRows = rows.filter(
      (row) => sheetName == (row.sheetName || "sheet1"),
    );
    if (type != "csv") {
      sheetRows = sheetRows.map((row) => {
        const { sheetName, ...rest } = row;
        return rest;
      });
    }
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  XLSX.writeFileXLSX(workbook, `${name}.${type}`);
}

export class Content extends DesignerPanel {
  name = new Props.String("Content");

  lastFocused = this.id;

  /** Delete the media files that are checked */
  async deleteSelected() {
    // list the names that are checked
    const toDelete = [
      ...document.querySelectorAll(
        "#ContentMedia input[type=checkbox]:checked",
      ),
    ].map((element) => {
      // clear the checks as we go
      const checkbox = /** @type{HTMLInputElement} */ (element);
      checkbox.checked = false;
      return checkbox.name;
    });
    const selectAll = /** @type {HTMLInputElement} */ (
      document.getElementById("ContentSelectAll")
    );
    if (selectAll) selectAll.checked = false;
    // delete them
    await pleaseWait(db.deleteMedia(...toDelete));
    // refresh the page
    Globals.state.update();
  }

  /** Check or uncheck all the media file checkboxes */
  selectAll({ target }) {
    for (const element of document.querySelectorAll(
      '#ContentMedia input[type="checkbox"]',
    )) {
      const checkbox = /** @type {HTMLInputElement} */ (element);
      checkbox.checked = target.checked;
    }
  }

  settings() {
    const data = Globals.data;
    return html`<div class=${this.CSSClasses("content")} id=${this.id}>
      <div>
        <h1>Content</h1>
        <p>
          ${data.allrows.length} rows with these fields:
          ${String([...data.allFields].sort()).replaceAll(",", ", ")}
        </p>
        <h2>Media files</h2>
        <button @click=${this.deleteSelected}>Delete checked</button>
        <label
          ><input
            type="checkbox"
            name="Select all"
            id="ContentSelectAll"
            @input=${this.selectAll}
          />Select All</label
        >
        <ol
          id="ContentMedia"
          style="column-count: 3"
          ref=${(/** @type {HTMLOListElement} */ ol) => {
            db.listMedia().then((names) => {
              const list = names.map(
                (name) =>
                  html`<li>
                    <label><input type="checkbox" name=${name} />${name}</label>
                  </li>`,
              );
              render(ol, html`${list}`);
            });
          }}
        ></ol>
      </div>
    </div>`;
  }
}
TreeBase.register(Content, "Content");
