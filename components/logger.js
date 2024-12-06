import { html } from "uhtml";
import { saveContent } from "app/spreadsheet";
import { TreeBase } from "./treebase";
import db from "app/db";
import * as Props from "./props";
import Globals from "app/globals";
import { access } from "app/eval";
import "css/logger.css";
import pleaseWait from "./wait";

export class Logger extends TreeBase {
  // Define properties
  stateName = new Props.String("$Log");
  logUntil = new Props.ADate();

  // Text area for specifying state and field names to log (e.g., #field1 $state1)
  logThese = new Props.TextArea("", {
    validate: this.validate,
    placeholder: "Enter state and field names to log",
  });

  // Text area for specifying event names to log
  logTheseEvents = new Props.TextArea("", {
    validate: this.validateEventNames,
    placeholder: "Enter names of events to log",
  });

  /**
   * Validate input for state and field names.
   * Expected format: #field1 $state1 $state2 #field3
   * @param {string} s
   * @returns {string} Error message or empty string if valid
   */
  validate(s) {
    return /^(?:[#$]\w+\s*)*$/.test(s) ? "" : "Invalid input";
  }

  /**
   * Validate input for event names.
   * Expected format: eventName1 eventName2
   * @param {string} s
   * @returns {string} Error message or empty string if valid
   */
  validateEventNames(s) {
    return /^(?:\w+\s*)*$/.test(s) ? "" : "Invalid input";
  }

  /**
   * Render the logging indicator.
   * If logging is active, capture and log the specified fields.
   * @returns {TemplateResult}
   */
  template() {
    const { state, actions } = Globals;
    const stateName = this.stateName.value;
    const logUntil = this.logUntil.value;
    const logThese = this.logThese.value;
    const logging =
      !!state.get(stateName) && logUntil && new Date() < new Date(logUntil);
    const getValue = access(state, actions.last.data);

    if (logging) {
      const names = logThese.split(/\s+/).filter(Boolean);
      const record = {};

      names.forEach((name) => {
        const value = getValue(name);
        if (value !== undefined) {
          record[name] = value;
        }
      });

      this.log(record);
    }

    return html`<div
      class="logging-indicator"
      ?logging=${logging}
      title="Logging"
    ></div>`;
  }

  /**
   * Log a record to the database with a timestamp.
   * @param {Object} record
   */
  log(record) {
    const dateTime = new Date().toLocaleString("en-US", {
      fractionalSecondDigits: 2,
      hour12: false,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    const logRecord = { DateTime: dateTime, ...record };
    db.writeLog(logRecord);
  }

  /**
   * Initialize the Logger by setting up event listeners.
   */
  init() {
    super.init();
    this.onUpdate();
  }

  /** @type {Set<string>} Set of active event listeners */
  listeners = new Set();

  /**
   * Update event listeners based on the current configuration.
   */
  onUpdate() {
    const UI = document.getElementById("UI");
    if (!UI) return;

    // Remove existing listeners
    this.listeners.forEach((eventName) => {
      UI.removeEventListener(eventName, this);
    });
    this.listeners.clear();

    // Add new listeners
    const eventNames = this.logTheseEvents.value.match(/\w+/g) || [];
    eventNames.forEach((eventName) => {
      UI.addEventListener(eventName, this);
      this.listeners.add(eventName);
    });
  }

  /** Types of properties to include in logs */
  typesToInclude = new Set(["boolean", "number", "string"]);

  /** Properties to exclude from event logs */
  propsToExclude = new Set([
    "isTrusted",
    "bubbles",
    "cancelBubble",
    "cancelable",
    "defaultPrevented",
    "eventPhase",
    "returnValue",
    "timeStamp",
  ]);

  /**
   * Handle events and log relevant properties.
   * @param {Event} e
   */
  handleEvent(e) {
    const record = {};

    for (const prop in e) {
      // Skip properties with all uppercase or starting with _
      if (/^[A-Z_]+$/.test(prop)) continue;

      const value = e[prop];
      if (this.propsToExclude.has(prop)) continue;
      if (!this.typesToInclude.has(typeof value)) continue;

      record[prop] = value;
    }

    this.log(record);
  }
}

// Register the Logger class
TreeBase.register(Logger, "Logger");

/**
 * Save the log records to an XLSX file.
 */
export async function SaveLog() {
  try {
    const toSave = await db.readLog();
    if (toSave.length > 0) {
      await pleaseWait(saveContent("log", toSave, "xlsx"));
      Globals.error.report("Log successfully saved.");
    } else {
      Globals.error.report("No log records to be saved.");
    }
    Globals.state.update();
  } catch (error) {
    Globals.error.report(`Failed to save log: ${error.message}`);
  }
}

/**
 * Clear all log records from the database.
 */
export async function ClearLog() {
  try {
    await db.clearLog();
    Globals.error.report("Log successfully cleared.");
    Globals.state.update();
  } catch (error) {
    Globals.error.report(`Failed to clear log: ${error.message}`);
  }
}

/**
 * Download the conversation history as a CSV file.
 */
export async function DownloadCSV() {
  const serverUrl = "http://34.118.128.211:5678/download_csv"; // Adjust if necessary

  try {
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversation_history.csv"; // Desired file name
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    Globals.error.report("CSV download initiated.");
  } catch (error) {
    console.error("Error downloading CSV:", error);
    Globals.error.report("Failed to download CSV.");
    // Optionally, you can implement a more user-friendly notification here
  }
}
