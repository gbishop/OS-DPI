import { html, render } from "uhtml";
import { TreeBase } from "./treebase";
import { DesignerPanel } from "./designer";
import * as Props from "./props";
import db from "app/db";
import "css/content.css";
import pleaseWait from "./wait";
import Globals from "app/globals";

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
          ${data.length} rows with these fields:
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
        <div
          ref=${(/** @type {HTMLOListElement} */ ol) => {
            db.listMedia().then((names) => {
              const list = names.map(
                (name) =>
                  html`<li>
                    <label><input type="checkbox" name=${name} />${name}</label>
                  </li>`,
              );
              const body = html`<ol id="ContentMedia" style="column-count: 3">
                ${list}
              </ol> `;
              render(ol, body);
            });
          }}
        ></div>
      </div>
    </div>`;
  }
  /**
   * Merge an object into the panel contents
   * @param {ExternalRep} obj
   * @returns {Promise<void>}
   */
  async merge(obj) {
    console.assert(obj.className == "Content", obj);
    const toMerge = obj.children;
    Globals.data.setContent(Globals.data.contentRows.concat(toMerge));
    db.write("content", Globals.data.contentRows);
    this.onUpdate();
  }
}
TreeBase.register(Content, "Content");
