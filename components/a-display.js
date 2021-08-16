import { html, render } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";

class ADisplay extends ABase {
  state = "a-display";
  background = "inherit";
  scale = 1;

  static observed = "state background scale";

  init() {
    state.define(this.state, "The utterance goes here");
    this.render();
  }

  render() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
    const msg = state(this.state);
    console.log("display", msg);
    render(this, html`${msg}`);
  }
}

customElements.define("a-display", ADisplay);
