import ABase from "./a-base";

class AHStack extends ABase {
  scale = "1";
  background = "";

  static observed = "scale background";

  template() {
    this.setStyle({ flexGrow: this.scale, backgroundColor: this.background });
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
  }
}
customElements.define("a-hstack", AHStack);
