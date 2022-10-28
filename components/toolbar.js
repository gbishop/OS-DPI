import { TreeBase } from "./treebase";
import css from "ustyler";
import db from "../db";
import { html } from "uhtml";
import Globals from "../globals";
import { Menu } from "./menu";

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");
    this.menu = new Menu("Add", () =>
      ["foo", "add this to that"].map((item) => ({
        label: item,
        callback: () => console.log("menu", item),
      }))
    );
    this.menu2 = new Menu("Delete", () =>
      ["delete this", "delete that"].map((item) => ({
        label: item,
        callback: () => console.log("menu", item),
      }))
    );
  }

  template() {
    const { state } = Globals;
    return html`
      <div class="bar">
        <label for="designName">Name: </label>
        <input
          id="designName"
          type="text"
          .value=${db.designName}
          .size=${Math.max(db.designName.length, 12)}
          onchange=${(event) =>
            db
              .renameDesign(event.target.value)
              .then(() => (window.location.hash = db.designName))}
        />
        <button onclick=${() => db.saveDesign()}>Export</button>
        <button onclick=${() => window.open("#", "_blank")}>Home</button>
        <button
          onclick=${async () => {
            const tab = state.get("designerTab").toLowerCase();
            if (["layout", "actions"].indexOf(tab) >= 0) {
              await db.undo(tab);
              Globals.restart();
            }
          }}
        >
          Undo
        </button>
        ${this.menu.render()} ${this.menu2.render()}
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

css`
  #toolbar {
    border: 1px solid black;
    padding: 3px;
    margin: 3px;
    background-color: #7bafd4;
    border-radius: 0.5em;
  }
  #toolbar button {
    border-radius: 0.5em;
  }
  #toolbar input {
    border-radius: 0.5em;
  }
`;

export default toolbar;
