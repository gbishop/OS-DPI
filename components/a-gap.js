import ABase from "./a-base";

class AGap extends ABase {
  scale = 1;
  background = "inherit";

  static observed = "scale background";

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
  }
}

customElements.define("a-gap", AGap);
