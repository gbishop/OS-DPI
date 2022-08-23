import { Base, componentMap, toDesign } from "./base";
import { html } from "uhtml";
import { styleString } from "./style";
import { log, logInit } from "../log.js"
import db from "../db";

import XLSX from "xlsx";

export class Logger extends Base {

  static defaultProps = {
    stateName: "$Logger",
    name: "Logger",
    click: false,
    keypress: false,

    smile: '',
    eyebrows: '',
    mouth: '',
    blink: ''
  };

  static instances = [];

  init() {
    window.addEventListener("click", this.onClick.bind(this));
    window.addEventListener("keypress", this.onKeypress.bind(this));
    Logger.instances.push(this);
  }
  
  clear() {
    this.DB.clear();
  }

  onClick(event) {
    if(this.props['click'] && document.getElementById("UI").contains(event.target)) {
      let {clientX, clientY} = event;

      this.DB.submit({
        "sheetName": "mouseclick", 
        "timestamp": Date.now(), 
        "value": {x: clientX, y: clientY}}
      );
    }
  }

  onKeypress(event) {
    switch(event.key) {
      case this.props['smile']:
        this.DB.submit({
          "sheetName": "gesture", 
          "timestamp": Date.now(), 
          "value": {"gesture": "smile"}
       });
        break;

      case this.props['eyebrows']:
        this.DB.submit({
          "sheetName": "gesture", 
          "timestamp": Date.now(), 
          "value": {"gesture": "eyebrows"}
       });
        break;

      case this.props['mouth']:
        this.DB.submit({
          "sheetName": "gesture", 
          "timestamp": Date.now(), 
          "value": {"gesture": "mouth"}
       });
        break;

      case this.props['blink']:
        this.DB.submit({
          "sheetName": "gesture", 
          "timestamp": Date.now(), 
          "value": {"gesture": "blink"}
       });
        break;
    }

    if(this.props['keypress']) {
      let {charCode, keyCode} = event;

      this.DB.submit({
        "sheetName": "keypress", 
        "timestamp": Date.now(), 
        "value": {charCode: String.fromCharCode(charCode), keyCode: keyCode}}
      );
    }
  }

  stringifyInput(state, array) {
    let output = {};

    for(let i = 0; i < array.length; i+=2)
      output[array[i]] = state.interpolate(i+1 < array.length ? array[i+1] : "");

    return output
  }

  template() {
    const { stateName, name  } = this.props;
    const { state } = this.context;

    if(!this.DB || this.DB.name != name) {
      this.DB = new LoggerDB(name);
    }

    if(state.hasBeenUpdated(stateName)) {
      let value = this.stringifyInput(state, state.get(stateName));
      this.DB.submit({"timestamp": Date.now(), "value": value });
    }

    return html``;
  }

  save() {
    const { tree } = this.context;
    const layout = toDesign(tree);
    db.write("layout", layout);
  }
}

componentMap.addMap("logger", Logger);

class LoggerDB {

  constructor(name) {
    this.name = name;

    let request = indexedDB.open(name, 3);
    request.onsuccess = event => this.#open(event, false);
    request.onupgradeneeded = event => this.#open(event, true);
    request.onerror = event => log("Database failed to open...");
  }

  #open(event, upgradeneeded) {
    this.DB = event.target.result;

    if(upgradeneeded) {
      let eventStore = this.DB.createObjectStore("event", {keyPath: "timestamp"});
      eventStore.createIndex("by-timestamp", "timestamp", {unique: false});
      console.log("Database sucessfully created!");
    }
    else
      console.log("Database successfully opened!");
  }

  clear() {
     let transaction = this.DB.transaction(["event"], "readwrite");
     let request = transaction.objectStore("event").clear();
     request.onsuccess = event => console.log("Database successfully cleared!");
     request.onerror = event => console.log("Database failed to clear...");
  }

  submit(...events) {
    let transaction = this.DB.transaction(['event'], 'readwrite');
    let eventStore = transaction.objectStore('event');
    events.filter(e => 'timestamp' in e).forEach(e => eventStore.add(e));
  }

  saveContent(rows, type) {
    if (!type) return;

    rows.forEach(row => row.sheetName = (row.sheetName != "undefined" ? row.sheetName : 'event'));

    const sheetNames = new Set(rows.map((row) => row.sheetName));
    const workbook = XLSX.utils.book_new();

    sheetNames.add('event');

    for (const sheetName of sheetNames) {
      let sheetRows = rows;

      if (type != "csv") {
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

  getRows(normalize=false, callback, ...args) {
    let transaction = this.DB.transaction(['event'], 'readonly');
    let eventStore = transaction.objectStore('event');
    let bytimestamp = eventStore.index('by-timestamp');

    let events = [];
    let columns = new Set();

    bytimestamp.openCursor().onsuccess = event => {
      let cursor = event.target.result;

      if(cursor) {
        let event = cursor.value;
        Object.keys(event.value).forEach(c => columns.add(c));
        events.push(event);
        cursor.continue();
      }

      else {
        let rows = [];

        for(let event of events) {
          let row = {'sheetName': `${event['sheetName']}`,'timestamp': `${event['timestamp']}`};

          if(normalize)
            columns.forEach(c => row[c] = (event.value[c] || ""))
          else
            Object.keys(event['value']).forEach(c => row[c] = (event.value[c] || ""));

          rows.push(row);
        }

        callback(rows, ...args);
      }
    };
  }
}
