import { html } from "uhtml";
import { TreeBase } from "../treebase";
import { TabPanel } from "../tabcontrol";
import * as Props from "../props";
import css from "ustyler";
import Globals from "../../globals";

export class Load extends TabPanel {
  name = new Props.String("Load");

  template() {
    return html`
      <div id="load-panel">
        <div id="load">
          <h3>Content from sheets</h3>
          <button onclick=${() => console.log("load panel - remote sheet")}>Remote sheet</button>
          <button onclick=${() => console.log("load panel - local sheet")}>Local sheet</button>
        </div>
        <div id="reload">
          <h3>Other</h3>
          <button onclick=${() => console.log("load panel - reload")}>Reload</button>
        </div>
      </div>
    `;
  }
}
TreeBase.register(Load);

css`
  #load-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
