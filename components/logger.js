import { html } from "uhtml";
import { saveContent } from "./content";
import { TreeBase } from "./treebase";
import { TabPanel } from "./tabcontrol";

import "css/logger.css";
import DB from "app/db";
import * as Props from "./props";
import Globals from "app/globals";

export class Logger extends TabPanel {
  name = new Props.String("Logger");
  stateName = new Props.String("$Log");
  dbName = new Props.String("Log");

  /** @type {Logger[]} */
  static instances = [];

  init() {
    Logger.instances.push(this);
  }

  template() {
    const { state } = Globals;
    const { stateName, name } = this.props;

    if (state.hasBeenUpdated(stateName)) {
      DB.read(this.name.value, []).then((value) => {
        value.push({
          timestamp: Date.now(),
          ...this.stringifyInput(state.get(stateName)),
        });
        DB.write(this.name.value, value);
      });
    }

    return html`<!--empty-->`;
  }

  stringifyInput(arr) {
    let output = {};

    for (let i = 0; i < arr.length; i += 2)
      output[arr[i]] = Globals.state.interpolate(
        i + 1 < arr.length ? arr[i + 1] : ""
      );

    return output;
  }
}
TabPanel.register(Logger, "Logger");

export class Logging extends TreeBase {
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
            }}
          >
            <option value="" invalid>Choose one...</option>
            ${Logger.instances.map(
              (l) =>
                html`<option
                  value="${Logger.instances.indexOf(l)}"
                  ?selected=${l.name.value === this.selected?.name.value}
                >
                  ${l.name.value}
                </option>`
            )}
          </select></label
        >

        <h2>Save content as a spreadsheet</h2>
        <label for="sheetType">Spreadsheet type</label>
        <select
          id="sheetType"
          onchange=${({ target }) => {
            if (this.selected && target.value !== "") {
              DB.read(this.selected.dbName.value, [{}]).then((rows) => {
                saveContent(this.selected.dbName.value, rows, target.value);
              });
            }
          }}
        >
          <option selected value="">Choose your format</option>
          <option value="xlsx">Excel .xlsx</option>
          <option value="xls">Excel .xls</option>
          <option value="ods">ODF Spreadsheet .ods</option>
          <option value="csv">Comma Separated Values .csv</option>
        </select>

        <h2>Clear log</h2>
        <button
          onclick=${() => {
            if (this.selected) {
              DB.write(this.selected.dbName.value, [{}]);
            }
          }}
        >
          Clear
        </button>
      </div>
    `;
  }
}
TreeBase.register(Logging, "Logging");
