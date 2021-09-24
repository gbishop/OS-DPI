import { html } from "uhtml";
import ABase from "./a-base";
import * as rules from "../rules";

class AButton extends ABase {
  text = "click me";
  name = "button";
  background = "";

  get designerChildren() {
    return [];
  }

  template() {
    const style = `background-color: ${this.background}`;
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
