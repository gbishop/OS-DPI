import ABase from "./a-base";
import { html } from "uhtml";

class AHStack extends ABase {
  scale = 1;
  background = "";

  static observed = "scale background";

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
  }
}
customElements.define("a-hstack", AHStack);
