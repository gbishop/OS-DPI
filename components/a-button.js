import { html } from "uhtml";
import ABase from "./a-base";
import * as rules from "../rules";

class AButton extends ABase {
  text = "click me";
  name = "button";
  background = "";

  get Children() {
    return [];
  }

  template() {
    const style = this.getStyleString({ backgroundColor: this.background });
    return html`<button
      name=${this.name}
      style=${style}
      onClick=${rules.handler(this.name, {}, "press")}
    >
      ${this.text}
    </button>`;
  }
}

customElements.define("a-button", AButton);
