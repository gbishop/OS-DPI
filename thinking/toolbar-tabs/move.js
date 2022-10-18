import { html } from "uhtml";
import { TreeBase } from "../../components/treebase";
import { TabPanel } from "../../components/tabcontrol";
import * as Props from "../../components/props";
import css from "ustyler";
import Globals from "../../globals";

export class Move extends TabPanel {
  name = new Props.String("Move");

  template() {
    return html`
      <div id="move-panel">
        <button onclick=${() => console.log("move panel - up in list")}>Up in list</button>
        <button onclick=${() => console.log("move panel - down in list")}>Down in list</button>
        <button onclick=${() => console.log("move panel - up one level")}>Up one level</button>
        <button onclick=${() => console.log("move panel - down one level")}>Down in level</button>
      </div>
    `;
  }
}
TreeBase.register(Move);

css`
  #move-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
