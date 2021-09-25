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

  get Children() {
    if (!this.active) {
      return [];
    }
    return super.Children;
  }

  get designerName() {
    if (this.active) return html`<b>${this.tagName} ${this.name}</b>`;
    else return `${this.tagName} ${this.name}`;
  }

  designerHighlight(open) {
    if (open) {
      state.update({ [this.control.state]: state.interpolate(this.name) });
    }
    super.designerHighlight(open);
  }
}
customElements.define("a-tab-panel", ATabPanel);
