import { html } from "uhtml";
import ABase from "./a-base";
import ATabControl from "./a-tab-control";
import { state } from "../state";
import { getColor } from "./color";

export default class ATabPanel extends ABase {
  scale = 1;
  background = "";
  name = "";
  label = "";

  static observed = "scale background name label";

  init() {
    /** @type {ATabControl} */
    this.control = this.closest("a-tab-control");
    this.active = false;
  }

  get designerName() {
    console.log("hi", this.name, this.active);
    if (this.active) return html`<b>${this.tagName} ${this.name}</b>`;
    else return `${this.tagName} ${this.name}`;
  }

  get designerChildren() {
    if (!this.active) {
      return [];
    }
    return super.designerChildren;
  }

  designerHighlight(open) {
    if (open) {
      const tabControl = this.control;
      // console.log("tc", tabControl);
      state.update({ [this.control.state]: state.interpolate(this.name) });
    }
    super.designerHighlight(open);
  }

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = getColor(this.background);
    console.log(
      "tabpanel background",
      this.background,
      this.style.backgroundColor
    );
  }
}
customElements.define("a-tab-panel", ATabPanel);
