// import { TreeBase } from "./treebase";
import "css/toolbar.css";
import db from "app/db";
// import { html } from "uhtml";
import Globals from "app/globals";
import { render, html } from "uhtml";
import { Menu, MenuItem } from "./menu";
import { TreeBase } from "./treebase";
import { callAfterRender } from "app/render";

export class ToolBar extends TreeBase {
  init() {
    console.log("toolbar init");

    const { designer } = Globals;
    console.log("in toolbar");
    // console.log(designer);
    console.log(designer.getCurrentPanel());
    this.menu = new Menu("Add", designer.getMenuItems, "add", designer.getCurrentPanel());
    this.menu2 = new Menu("Delete", designer.getMenuItems, "delete", designer.getCurrentPanel());
    this.menu3 = new Menu("Move", designer.getMenuItems, "move", designer.getCurrentPanel());
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
        <span id="ContextSpecificMenu">
          ${this.menu.render()} ${this.menu2.render()} ${this.menu3.render()}
        </span>
      </div>
    `;
  }
}
TreeBase.register(ToolBar, "ToolBar");

export default toolbar;