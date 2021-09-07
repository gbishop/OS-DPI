import { html } from "uhtml";
import ABase from "./a-base";
import * as rules from "../rules";

class AButton extends ABase {
  name = "button";
  background = "inherit";

  init() {
    this.content = this.innerHTML;
  }

  template() {
    const style = `background-color: ${this.background}`;
    return html`<button
      name=${this.name}
      style=${style}
      onClick=${rules.handler(this.name, {}, "press")}
    >
      ${this.content}
    </button>`;
  }
}

customElements.define("a-button", AButton);
