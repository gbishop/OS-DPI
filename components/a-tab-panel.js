import ABase from "./a-base";
import ATabControl from "./a-tab-control";
import { state } from "../state";

export default class ATabPanel extends ABase {
  scale = 1;
  background = "inherit";
  name = "";
  label = "";

  static observed = "scale background name label";

  init() {
    /** @type {ATabControl} */
    this.control = this.closest("a-tab-control");
    this.active = false;
  }

  get designerName() {
    return `${this.tagName} ${this.name}`;
  }

  get designerChildren() {
    if (!this.active) {
      return [];
    }
    return super.designerChildren;
  }

  get designerStyle() {
    return `background-color: ${this.background}`;
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
    this.style.backgroundColor = this.background;
  }
}
customElements.define("a-tab-panel", ATabPanel);
