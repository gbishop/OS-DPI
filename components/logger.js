import { html } from "uhtml";
import { saveContent } from "./content";
import { TreeBase } from "./treebase";
import db from "app/db";
import * as Props from "./props";
import Globals from "app/globals";
import { access } from "app/eval";
import "css/logger.css";

export class Logger extends TreeBase {
  // name = new Props.String("Log");
  stateName = new Props.String("$Log");
  logUntil = new Props.ADate();

  /**
   * @param {string} s
   * @returns {string}
   */
  validate(s) {
    return /^(?:[#$]\w+\s*)*$/.test(s) ? "" : "Invalid input";
  }

  // I expect a string like #field1 $state1 $state2 #field3
  logThese = new Props.TextArea("", { validate: this.validate });

  template() {
    const { state, actions } = Globals;
    const { stateName, logUntil, logThese } = this.props;
    const logging =
      !!state.get(stateName) && logUntil && new Date() < new Date(logUntil);
    const getValue = access(state, actions.last.data);

    if (logging) {
      const names = logThese.split(/\s+/);
      const DateTime = new Date().toLocaleDateString("en-US", {
        fractionalSecondDigits: 1,
        hour12: false,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
      const record = { DateTime };
      for (const name of names) {
        const value = getValue(name);
        if (value) {
          record[name] = value;
        }
      }
      db.write("log", record);
    }

    return html`<div class="logging-indicator" ?logging=${logging}></div>`;
  }
}
TreeBase.register(Logger, "Logger");

export async function SaveLogs() {
  const toSave = await db.readAll("log");
  await saveContent("log", toSave, "xlsx");
}

export async function ClearLogs() {
  await db.clear("log");
}
