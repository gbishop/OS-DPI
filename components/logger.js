import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { log } from "../log"

import * as XLSX from "xlsx";
import Globals from "../globals";

export class Logger extends Base {

    static instances = [];

    static defaultProps = {
        stateName: "$Log",
        name: "Log"
    };

    init() {
        this.DB = new DB();
        Logger.instances.push(this);
    }

    template() {
        const { state } = Globals;
        const { stateName, name  } = this.props;
    
        if(state.hasBeenUpdated(stateName)) {
          let value = this.stringifyInput(state.get(stateName));
          this.DB.submit({"timestamp": Date.now(), "value": value});
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

class DB {

    #DB = undefined;

    constructor(name="default-log") {
        this.name = name;
    }

    async DB() {
        let request = indexedDB.open(this.name, 3);

        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => {
                this.#open(e, false);
                resolve(this.#DB);
            };

            request.onupgradeneeded = (e) => {
                this.#open(e, true)
                resolve(this.#DB);
            };

            request.onerror = (e) => {
                log(`'${this.name}' database failed to open!`)
                reject(`'${this.name}' database failed to open!`)
            };
        });
    }

    #open(event, upgradeNeeded) {
        this.#DB = event.target.result;

        if(upgradeNeeded) {
            let eventStore = this.#DB.createObjectStore("event", {keyPath: "timestamp"});
            eventStore.createIndex("by-timestamp", "timestamp", {unique: false});
        }

        log(`'${this.name}' database successfully ${upgradeNeeded ? 'created' : 'opened'}!`);
    }

    async clear() {
        let request = (await this.DB())
            .transaction(["event"], "readwrite")
            .objectStore("event")
            .clear();

        request.onsuccess = (e) =>  log(`'${this.name}' database successfully cleared!`);
        request.onerror = (e) =>  log(`'${this.name}' database failed to clear!`);
    }

    async submit(...events) {
        let eventStore = (await this.DB())
            .transaction(["event"], "readwrite")
            .objectStore("event");
        
        events.filter(e => "timestamp" in e).forEach(e => eventStore.add(e));
    }

    async save(type='csv') {
        const rows = await this.#fetchRows(type);
        rows.forEach(row => row.sheetName = (row.sheetName != "undefined" ? row.sheetName : 'event')); 
        const sheetNames = new Set(rows.map((row) => row.sheetName));
        sheetNames.add('event');
        const workbook = XLSX.utils.book_new();

        for (const sheetName of sheetNames) {
            let sheetRows = rows;

            if (!type.match(/csv/i)) {
                sheetRows = rows.filter((row) => sheetName == row.sheetName);
                sheetRows = sheetRows.map((row) => {
                    const { sheetName, ...rest } = row;
                    return rest;
                });
            }

            const worksheet = XLSX.utils.json_to_sheet(sheetRows);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        XLSX.writeFile(workbook, `${this.name}.${type}`);
    }

    async #fetchRows(type='csv') {
        let request = (await this.DB()).transaction(["event"], "readonly");
        let query = request
            .objectStore("event")
            .index("by-timestamp");

        let events = new Set(), columns = new Set();

        return new Promise((resolve, reject) => {
            query.openCursor().onsuccess = (e) => {
                let cursor = e.target.result;

                if(cursor) {
                    let event = cursor.value;

                    try {
                        Object.keys(event.value).forEach(v => columns.add(v));
                        events.add(event);
                    } catch(e) {

                    } finally {
                        cursor.continue();
                    }
                }

                else {
                    let rows = [];

                    for(let event of events) {
                        let row = {"sheetName": event.sheetName, "timestamp": `${event.timestamp}`};

                        (type.match(/csv/i) ? columns : Object.keys(event.value))
                            .forEach(column => row[column] = (event.value[column] || ""));

                        rows.push(row);
                    }

                    resolve(rows);
                }
            };
        });
    }
}