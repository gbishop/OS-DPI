import { html } from "uhtml";
import { TreeBase } from "./treebase";
import css from "ustyler";
import Globals from "../globals";

export class Monitor extends TreeBase {
  uiTemplate() {
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
            const value = state.get(key);
            return html`<tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>`;
          })}
      </tbody>
    </table>`;

    const row = rules.last.data;
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
          rules.init();
        }}
      >
        Clear state
      </button>
      <div>${s}${f}</div>`;
  }
}

css`
  #monitor {
    margin-top: 1em;
    margin-left: 1em;
  }

  #monitor div {
    display: flex;
    height: 100%;
    overflow-y: auto;
    font-size: 75%;
    margin-top: 0.2em;
  }

  #monitor table {
    border-collapse: collapse;
    border: 1px solid black;
    height: max-content;
    margin-right: 1em;
  }

  #monitor table td,
  #monitor table th {
    border: 1px solid black;
    padding: 0.5em;
  }
`;
