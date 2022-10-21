import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { TabPanel } from "./tabcontrol";
import css from "ustyler";
import db from "../db";
import Globals from "../globals";

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
TreeBase.register(Layout);

css`
  div.layout {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    overflow: hidden;
  }

  .layout ol {
    list-style-type: none;
  }

  .layout details {
    display: inline-block;
  }

  div.empty {
    background-color: rgba(15, 15, 15, 0.3);
    justify-content: center;
    align-items: center;
  }

  div.empty::before {
    content: "Empty";
  }

  div.highlight {
    border: 1px solid red;
    box-sizing: border-box;
  }
`;
