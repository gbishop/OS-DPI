import ABase from "./a-base";

class AGap extends ABase {
  scale = "1";
  background = "";

  static observed = "scale background";

  template() {
    this.setStyle({ flexGrow: this.scale, backgroundColor: this.background });
  }
}

customElements.define("a-gap", AGap);
