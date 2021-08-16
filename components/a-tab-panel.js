import ABase from "./a-base";

export default class ATabPanel extends ABase {
  scale = 1;
  background = "inherit";
  name = "";
  label = "";

  static observed = "scale background name label";

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
  }
}
customElements.define("a-tab-panel", ATabPanel);
