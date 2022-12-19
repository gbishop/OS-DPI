import { html } from "uhtml";
import { saveContent } from "./content";
import { TreeBase } from "./treebase";
import db from "app/db";
import * as Props from "./props";
import Globals from "app/globals";

export class Logger extends TreeBase {
  name = new Props.String("Log");
  stateName = new Props.String("$Log");

  get type() {
    return "_" + this.name.value;
  }

  /** @type {Logger[]} */
  static instances = [];

  init() {
    Logger.instances.push(this);
  }

  template() {
    const { state } = Globals;
    const stateName = this.stateName.value;
    const type = this.type;

    if (state.hasBeenUpdated(stateName)) {
      const value = state.get(stateName);
      const record = { timestamp: Date.now(), ...this.stringifyInput(value) };
      db.write(type, record);
    }

    return html`<!--empty-->`;
  }

  /** @param {string[]} arr */
  stringifyInput(arr) {
    let output = {};

    for (let i = 0; i < arr.length; i += 2)
      output[arr[i]] = Globals.state.interpolate(
        i + 1 < arr.length ? arr[i + 1] : ""
      );

    return output;
  }
}
TreeBase.register(Logger, "Logger");

export async function SaveLogs() {
  for (const log of Logger.instances) {
    const toSave = await db.read(log.type, [{}]);
    await saveContent(log.name.value, toSave, "xlsx");
  }
}

export async function ClearLogs() {
  for (const log of Logger.instances) {
    await db.clear(log.type);
  }
}
