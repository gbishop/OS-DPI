import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { TabPanel } from "./tabcontrol";
import * as Props from "./props";
import { Logger } from "./logger";
import css from "ustyler";
import Globals from "../globals";

export class Logging extends TabPanel {
  name = new Props.String("Logging");

  template() {
    this.selected = this.selected || Logger.instances?.[0];

    return html`
      <div id="logging-panel">
        <h2>Select Logger</h2>
        <label
          >Logger
          <select
            onchange=${({ target }) => {
              this.selected = Logger.instances?.[target.value || 0];
              Globals.update();
            }}
          >
            <option value="" invalid>Choose one...</option>
            ${Logger.instances.map(
              (l) =>
                html`<option
                  value="${Logger.instances.indexOf(l)}"
                  ?selected=${l.name === this.selected?.name}
                >
                  ${l.name}
                </option>`
            )}
          </select></label
        >

        <h2>Save content as a spreadsheet</h2>
        <label for="sheetType">Spreadsheet type</label>
        <select
          id="sheetType"
          onchange=${({ target }) => {
            if (Logger.instances.length > 0 && target.value !== "")
              this.selected?.DB.save(target.value);
          }}
        >
          <option selected value="">Choose your format</option>
          <option value="xlsx">Excel .xlsx</option>
          <option value="xls">Excel .xls</option>
          <option value="ods">ODF Spreadsheet .ods</option>
          <option value="csv">Comma Separated Values .csv</option>
        </select>

        <h2>Clear log</h2>
        <button onclick=${() => this.selected?.DB.clear()}>Clear</button>
      </div>
    `;
  }
}
TreeBase.register(Logging);

css`
  #logging-panel {
    margin: 5px;
  }
`;
