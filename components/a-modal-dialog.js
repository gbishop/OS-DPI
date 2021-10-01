import { html } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import * as focusTrap from "focus-trap";

export default class AModalDialog extends ABase {
  state = "$modalOpen";
  background = "";

  init() {
    state.observe(this, this.state);
    // console.log("init modal");
    this.content = Array.from(this.childNodes);
    this.elements = Array.from(super.getChildren());
    this.trap = focusTrap.createFocusTrap(this, {
      onDeactivate: () => state.update({ $Slots: { open: false } }),
    });
  }

  template() {
    // console.log(state());
    this.setStyle({ backgroundColor: this.background });
    if (state(this.state)) {
      this.classList.add("open");
      if (!document.body.classList.contains("designing")) {
        this.trap.activate();
      }
    } else {
      this.classList.remove("open");
      this.trap.deactivate();
    }
    return html`<div>${this.content}</div>`;
  }

  getChildren() {
    return this.elements;
  }

  makeVisible(v) {
    state.update({ [this.state]: v ? "open" : "" });
  }
}

customElements.define("a-modal-dialog", AModalDialog);
