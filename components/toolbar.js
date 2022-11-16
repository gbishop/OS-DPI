import { TreeBase } from "./treebase";
import "css/toolbar.css";
import db from "app/db";
import { html } from "uhtml";
import Globals from "app/globals";
import { Menu } from "./menu";

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");
    // this.menu = new Menu("Add", getMenuItems, 'add');
    // this.menu2 = new Menu("Delete", getMenuItems, 'delete');
  }

  template() {
    const { state, designer } = Globals;
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
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

export default toolbar;
