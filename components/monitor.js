import {html} from "uhtml";
import {Base} from "./base";
import css from "ustyler";

export class Monitor extends Base {
  template() {
    const {state, rules} = this.context;
    const s = html`<table class="state">
      <thead>
        <tr>
          <th>State</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(state.values).map((key) => {
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

    return html`${s}${f}`;
  }
}

css`
  #monitor {
    display: flex;
    height: 100%;
    overflow-y: auto;
    font-size: 75%;
  }

  #monitor table {
    margin-top: 1em;
    margin-left: 1em;
    border-collapse: collapse;
    border: 1px solid black;
    height: max-content;
  }

  #monitor table td,
  #monitor table th {
    border: 1px solid black;
    padding: 0.5em;
  }
`;
