import { html } from "uhtml";
import { TreeBase } from "../treebase";
import { TabPanel } from "../tabcontrol";
import * as Props from "../props";
import css from "ustyler";
import Globals from "../../globals";

export class Delete extends TabPanel {
  name = new Props.String("Delete");

  template() {
    return html`
      <div id="delete-panel">
        <button onclick=${() => console.log("delete panel - current object")}>Current Object</button>
        <button onclick=${() => console.log("delete panel - parent object")}>Parent Object</button>
      </div>
    `;
  }
}
TreeBase.register(Delete);

css`
  #delete-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
