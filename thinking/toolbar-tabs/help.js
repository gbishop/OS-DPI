import { html } from "uhtml";
import { TreeBase } from "../treebase";
import { TabPanel } from "../tabcontrol";
import * as Props from "../props";
import css from "ustyler";
import Globals from "../../globals";

export class Help extends TabPanel {
  name = new Props.String("Help");

  template() {
    return html`
      <div id="help-panel">
        <div id="logging">
          <h3>Logging</h3>
          <button onclick=${() => console.log("help panel - select logger")}>Select logger</button>
          <button onclick=${() => console.log("help panel - clear log")}>Clear log</button>
        </div>
        <div id="guides">
          <h3>Guides</h3>
          <p>You can access relevant pages of the general guide on specific components by pressing Ctrl+Alt+? (or control+option+? for Mac users).</p>
          <button onclick=${() => console.log("help panel - general guide")}>
            <a href="https://github.com/UNC-Project-Open-AAC/OS-DPI/wiki/Actions"
            target=new>
            View general guide
            </a>
          </button>
          <button onclick=${() => console.log("help panel - dev guide")}>
            <a href="https://github.com/christineiym/OS-DPI/wiki"
            target=new>
            View software developer guide
            </a>
          </button>
        </div>
      </div>
    `;
  }
}
TreeBase.register(Help);

css`
  #help-panel {
    margin: 5px;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto auto auto;
    columnn-gap: 5px;
  }
`;
