import { html } from "uhtml";
import { Base } from "./base";
import { Logger } from "./logger";

import css from "ustyler";

export class Logging extends Base {

  static defaultProps = {
    scale: "1",
  };

  template() {

    return html`
    <div id="logging-panel">

      <h1>Select Logger</h1>
      <select onchange=${(e) => this.selected = e.target.value}>
        ${Logger.instances.map(l => html`<option value='${Logger.instances.indexOf(l)}'>${l.name}</option>`)}
      </select>

      <h2>Save content as a spreadsheet</h2>
      <label for="sheetType">Spreadsheet type</label>
      <select
        id="sheetType"
        onchange=${(e) => {
          if(Logger.instances.length <= 0)
            return;

          let type = e.target.value;
          let logger = Logger.instances[this.selected || 0];
          let normalize = type == "csv" ? true : false;

          logger.DB.getRows(normalize, logger.DB.saveContent.bind(logger), type);
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
        onclick=${(e) => {
          if(Logger.instances.length <= 0)
            return;

          let logger = Logger.instances[this.selected || 0];
          logger.DB.clear();
        }
      }
      >
      Clear</button>
    </div>
    `;
  }
}

css`
  #logging-panel {
    margin: 5px;
  }
`;
