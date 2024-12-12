// Monitor.js

import { html } from "./UHTML"; 
import { TreeBase } from "./treebase";
import "css/monitor.css";
import Globals from "app/globals";
import { accessed } from "app/eval";
import { toString } from "components/slots";

export class Monitor extends TreeBase {
  template() {
    const { state, actions: rules } = Globals;
    const stateKeys = [
      ...new Set([...Object.keys(state.values), ...accessed.keys()]),
    ].sort();

    // Debugging: Log stateKeys
    console.log("Rendering Monitor - State Keys:", stateKeys);

    const s = html`<table class="state">
      <thead>
        <tr>
          <th>State</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${stateKeys
          .filter((key) => key.startsWith("$"))
          .map((key) => {
            let value = state.get(key);
            value = toString(value);
            let clamped = value.slice(0, 30);
            if (value.length > clamped.length) {
              clamped += "...";
            }

            // Ensure clamped is always a string
            clamped = String(clamped);

            // Debugging: Log each state row
            console.log(`State Key: ${key}, Value: ${clamped}`);

            return html`<tr
              ?updated=${Boolean(state.hasBeenUpdated(key))}
              ?undefined=${Boolean(accessed.get(key) === false)}
            >
              <td>${key}</td>
              <td>${clamped}</td>
            </tr>`;
          })}
      </tbody>
    </table>`;

    const row = rules.last.data || {};
    const rowAccessedKeys = [...accessed.keys()]
      .filter((key) => key.startsWith("_"))
      .map((key) => key.slice(1));
    const rowKeys = [
      ...new Set([...Object.keys(row), ...rowAccessedKeys]),
    ].sort();

    // Debugging: Log rowKeys
    console.log("Rendering Monitor - Row Keys:", rowKeys);

    const f = html`<table class="fields">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${rowKeys.map((key) => {
          const value = row[key];
          const displayValue = typeof value === "string" ? value : String(value || "");

          // Debugging: Log each field row
          console.log(`Field Key: ${key}, Value: ${displayValue}`);

          return html`<tr
            ?undefined=${Boolean(accessed.get(`_${key}`) === false)}
            ?accessed=${Boolean(accessed.has(`_${key}`))}
          >
            <td>#${key}</td>
            <td>${displayValue}</td>
          </tr>`;
        })}
      </tbody>
    </table>`;

    return html`<button
        @click=${() => {
          state.clear();
          rules.configure();
        }}
      >
        Clear state
      </button>
      <div>${s}${f}</div>`;
  }
}
TreeBase.register(Monitor, "Monitor");
