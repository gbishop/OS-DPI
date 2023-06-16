import { html } from "uhtml";
import { TreeBase } from "./treebase";
import "css/monitor.css";
import Globals from "app/globals";

export class Monitor extends TreeBase {
  template() {
    const { state, actions: rules } = Globals;
    const s = html`<table class="state">
      <thead>
        <tr>
          <th>State</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(state.values)
          .filter((key) => key.startsWith("$"))
          .map((key) => {
            const value = state.get(key).toString();
            let clamped = value.slice(0, 30);
            if (value.length > clamped.length) {
              clamped += "...";
            }
            return html`<tr>
              <td>${key}</td>
              <td>${clamped}</td>
            </tr>`;
          })}
      </tbody>
    </table>`;

    const row = rules.last.data || {};
    const f = html`<table class="fields">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(row).map((key) => {
          const value = row[key];
          return html`<tr>
            <td>#${key}</td>
            <td>${value}</td>
          </tr>`;
        })}
      </tbody>
    </table>`;

    return html`<button
        onclick=${() => {
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
