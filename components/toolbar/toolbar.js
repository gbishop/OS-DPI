import css from "ustyler";
import db from "../../db";
import { html } from "uhtml";
import Globals from "../../globals";
import { TreeBase } from "../treebase";
import { ButtonWrap } from "../designer-tabs/access";
import { Menu } from "../menu/index";
import { toolbarAction, toolbarActions } from "./toolbar-actions";

/* Menu */
const menu = new Menu("File", [{"label": "Rename"}, {"label": "Export"}]);

// TODO: menu item interface
// TODO: use TreeBase to list toolbarActions

// export class PatternList extends TabPanel {
//   name = new Props.String("Patterns");

//   /** @type {PatternManager[]} */
//   children = [];

//   template() {
//     return html`<div class="PatternList" id=${this.id}>
//       ${this.unorderedChildren()}
//     </div>`;
//   }
// }

export class ToolBar extends TreeBase {
  template() {
    const { state } = Globals;
    return html`
      <div class="toolbar">
      <div class="topBar flex">
        <div id="menu">${menu.render()}</div>

        <button id="home" onclick=${() => window.open("#", "_blank")}>Home</button>
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
        <div class="tabs" id="tabs">
          <button onclick=${() => console.log("tab clicked")}>Load</button>
          <button onclick=${() => console.log("tab clicked")}>Add</button>
          <button onclick=${() => console.log("tab clicked")}>Delete</button>
          <button onclick=${() => console.log("tab clicked")}>Move</button>
          <button onclick=${() => console.log("tab clicked")}>Help</button>
        </div>
      </div>

      <div class="dynamicBar flex">          
        <button onclick=${() => console.log("option clicked")}>Option</button>  
      <div class="dynamicBar"> 
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
    display: grid;
    grid-template-rows: 50% 50%;
  }
  #toolbar button {
    border-radius: 0.5em;
  }
  #toolbar input {
    border-radius: 0.5em;
  }
  #topBar {
    grid-row-start: 1;
    grid-row-end: 2;
  }
  #dynamicBar {
    grid-row-start: 2;
  }
  #dynamicBar button {
    background-color: #fcba03;
    border-radius: 0em;
    margin: 3px;
  }
  #tabs button {
    background-color: #bbd8f0;
    border-radius: 0em;
    margin: 3px;
  }
`;

export default toolbar;

/* 
        <div class="flex topbar" style="display: inline">
          <ul>
            <li class="topbarItem" style="display: inline"><div id="menu">${menu.render()}</div></li>
            <li class="topbarItem" style="display: inline"><button id="home" onclick=${() => window.open("#", "_blank")}>Home</button></li>
          </ul>
        </div>

  #topbar ul {
    display: inline;
    padding: 2px;
  }
  #topbar li {
    display: inline;
  }
          <label for="designName">Name: </label>
            id="designName"
          type="text"
          .value=${db.designName}
          onchange=${(event) =>
            db
              .renameDesign(event.target.value)
              .then(() => (window.location.hash = db.designName))}
          />
*/