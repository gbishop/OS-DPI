import { Base } from "./base.js";
import css from "../_snowpack/pkg/ustyler.js";
import db from "../db.js";
import { html } from "../_snowpack/pkg/uhtml.js";
import { Globals } from "../start.js";

export class ToolBar extends Base {
  template() {
    const { state } = Globals;
    return html`
      <div class="bar">
        <label for="designName">Name: </label>
        <input
          id="designName"
          type="text"
          .value=${db.designName}
          .size=${Math.max(db.designName.length, 12)}
          onchange=${(event) =>
            db
              .renameDesign(event.target.value)
              .then(() => (window.location.hash = db.designName))}
        />
        <button onclick=${() => db.saveDesign()}>Export</button>
        <button onclick=${() => window.open("#", "_blank")}>Home</button>
        <button
          onclick=${async () => {
            const tab = state.get("designerTab").toLowerCase();
            if (["layout", "actions"].indexOf(tab) >= 0) {
              await db.undo(tab);
              Globals.restart();
            }
          }}
        >
          Undo
        </button>
      </div>
    `;
  }
}

css`
  #toolbar {
    border: 1px solid black;
    padding: 3px;
    margin: 3px;
    background-color: #7bafd4;
    border-radius: 0.5em;
  }
  #toolbar button {
    border-radius: 0.5em;
  }
  #toolbar input {
    border-radius: 0.5em;
  }
`;

export default toolbar;
