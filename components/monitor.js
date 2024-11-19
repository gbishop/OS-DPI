import { html } from "uhtml";
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
            return html`<tr
              ?updated=${state.hasBeenUpdated(key)}
              ?undefined=${accessed.get(key) === false}
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
          return html`<tr
            ?undefined=${accessed.get(`_${key}`) === false}
            ?accessed=${accessed.has(`_${key}`)}
          >
            <td>#${key}</td>
            <td>${value || ""}</td>
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
