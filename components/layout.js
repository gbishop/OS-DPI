import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { TabPanel } from "./tabcontrol";
import "css/layout.css";
import db from "app/db";
import Globals from "app/globals";

export class Layout extends TabPanel {
  template() {
    return html`<div class="treebase layout" help="Layout tab" id=${this.id}>
      ${this.children[0].settings()}
    </div>`;
  }

  /** Update the state
   */
  onUpdate() {
    db.write("layout", this.children[0].toObject());
    Globals.state.update();
  }
}
TreeBase.register(Layout, "Layout");
