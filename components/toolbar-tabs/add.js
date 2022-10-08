import { html } from "uhtml";
import { TreeBase } from "../treebase";
import { TabPanel } from "../tabcontrol";
import * as Props from "../props";
import css from "ustyler";
import Globals from "../../globals";

export class Add extends TabPanel {
  name = new Props.String("Add");

  template() {
    return html`
      <div id="add-panel">
        <div id="general">
          <h3>General</h3>
          <button onclick=${() => console.log("add panel - layout")}>Layout node</button>
          <button onclick=${() => console.log("add panel - action")}>Action</button>
          <button onclick=${() => console.log("add panel - action")}>Cue</button>
          <button onclick=${() => console.log("add panel - action")}>Pattern</button>
          <button onclick=${() => console.log("add panel - action")}>Method</button>
        </div>
        <div id="content">
          <h3>Content</h3>
          <button onclick=${() => console.log("add panel - audio")}>Audio</button>
          <button onclick=${() => console.log("add panel - images")}>Images</button>
        </div>
      </div>
    `;
  }
}
TreeBase.register(Add);

css`
  #add-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
