import { TreeBase } from "./treebase";
import css from "ustyler";
import db from "../db";
import { html } from "uhtml";
import Globals from "../globals";

// TODO: enumerate components, make accessible through search bar and key mappings

export class ToolBar extends TreeBase {
  template() {
    const { state } = Globals;
    return html`
      <div class="bar">
        <button id="home" onclick=${() => window.open("#", "_blank")}>Home</button>
        <label for="designName">Name: </label>
        <input
          id="designName"
          type="text"
          .value=${db.designName}
          onchange=${(event) =>
            db
              .renameDesign(event.target.value)
              .then(() => (window.location.hash = db.designName))}
          />
        <button onclick=${() => db.saveDesign()}>Export</button>
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
