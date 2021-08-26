import { html, render } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import { formatSlottedString } from "./helpers";

class ADisplay extends ABase {
  state = "a-display";
  slots = "$slots";
  background = "inherit";
  scale = 1;

  static observed = "state background scale";

  init() {
    state.define(this.state, "The utterance goes here");
    state.define(this.slots, []);
    this.render();
  }

  render() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
    const msg = formatSlottedString(state(this.state));
    // parse the message and replace any slots
    console.log("display", msg);
    render(this, html`${msg}`);
  }
}

customElements.define("a-display", ADisplay);
