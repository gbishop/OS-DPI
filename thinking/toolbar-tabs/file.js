import { html } from "uhtml";
import { TreeBase } from "../treebase";
import { TabPanel } from "../tabcontrol";
import * as Props from "../props";
import css from "ustyler";
import Globals from "../../globals";

export class File extends TabPanel {
  name = new Props.String("File");

  template() {
    return html`
      <div id="file-panel">
      <div id="export">
        <h3>Export</h3>
        <button onclick=${() => console.log("file panel - export to spreadsheet")}>Export to Spreadsheet</button>
      </div>
      </div>
    `;
  }
}
TreeBase.register(File);

css`
  #file-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
