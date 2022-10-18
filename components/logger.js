import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { log } from "../log"
import { saveContent } from "./content"

import css from "ustyler";
import DB from "../db";
import * as XLSX from "xlsx";
import Globals from "../globals";

export class Logger extends Base {

    static instances = [];

    static defaultProps = {
        stateName: "$Log",
        name: "Log"
    };

    init() {
        // this.DB = new DB();
        Logger.instances.push(this);
    }

    template() {
        const { state } = Globals;
        const { stateName, name  } = this.props;
    
        if(state.hasBeenUpdated(stateName)) {
            DB.read(this.name, []).then(value => {
                value.push({timestamp: Date.now(), ...this.stringifyInput(state.get(stateName))});
                DB.write(this.name, value);
            });
        }
    
        return html`<!--empty-->`;
    }

    stringifyInput(arr) {
        let output = {};
        
        for(let i = 0; i < arr.length; i+=2)
          output[arr[i]] = Globals.state.interpolate(i + 1 < arr.length ? arr[i+1] : "");
    
        return output
    }
}

componentMap.addMap("logger", Logger);

export class Logging extends Base {

    static defaultProps = {
        scale: "1",
    };

    template() {

        this.selected = (this.selected || "");

        return html`
            <div id="logging-panel">
                <h1>Select Logger</h1>
                <select onchange=${(e) => {
                        this.selected = (Logger.instances?.[e.target.value] || ""); 
                    }
                }>
                    <option selected value="">Choose a logger</option>
                    ${Logger.instances.map(l => html`<option value='${Logger.instances.indexOf(l)}' ?selected=${l.name === this.selected?.name}>${l.name}</option>` )}
                </select>

                <h2>Save content as a spreadsheet</h2>
                <label for="sheetType">Spreadsheet type</label>
                <select
                    id="sheetType"
                    onchange=${(e) => {
                        if(this.selected !== "" && e.target.value !== "") {
                            DB.read(this.selected.name, []).then(rows => saveContent(this.selected.name, rows, e.target.value));
                        }
                            
                    }
                }>
                    <option selected value="">Choose your format</option>
                    <option value="xlsx">Excel .xlsx</option>
                    <option value="xls">Excel .xls</option>
                    <option value="ods">ODF Spreadsheet .ods</option>
                    <option value="csv">Comma Separated Values .csv</option>
                </select>

                <h2>Clear log</h2>
                <button onclick=${() => {DB.write(this.selected.name, [])}}>Clear</button>
            </div>
        `;
    }
}

css`
  #logging-panel {
    margin: 5px;
  }
`;
