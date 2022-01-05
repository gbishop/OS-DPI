import { Base } from "./base";
import css from "ustyler";
import db from "../db";
import { html } from "uhtml";

export class ToolBar extends Base {
  template() {
    const { state } = this.context;
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
        <button onclick=${() => db.saveDesign()}>Save</button>
        <button onclick=${() => window.open("#", "_blank")}>Open</button>
        <button
          onclick=${async () => {
            console.log(state.values);
            console.log(state.get("designerTab"));
            const tab = state.get("designerTab").toLowerCase();
            if (["layout", "actions"].indexOf(tab) >= 0) {
              console.log("undo", tab);
              await db.undo(tab);
              this.context.restart();
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
