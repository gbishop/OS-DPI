import { html } from "uhtml";
import ABase from "./a-base";
import ATabControl from "./a-tab-control";
import { state } from "../state";

export default class ATabPanel extends ABase {
  background = "";
  name = "";
  label = "";

  static observed = "background name label";

  init() {
    /** @type {ATabControl} */
    this.control = this.closest("a-tab-control");
    this.active = false;
  }
  template() {
    this.setStyle({ backgroundColor: this.background });
  }
  /* for the designer */

  getName() {
    if (this.active) return html`<b>${this.tagName} ${this.name}</b>`;
    else return `${this.tagName} ${this.name}`;
  }

  setHighlight(highlight) {
    if (highlight) {
      this.makeVisible();
    }
    super.setHighlight(highlight);
  }

  makeVisible() {
    state.update({ [this.control.state]: state.interpolate(this.name) });
  }
}
customElements.define("a-tab-panel", ATabPanel);
