import { html } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import * as focusTrap from "focus-trap";

class AModalDialog extends ABase {
  state = "$modalOpen";
  background = "white";

  init() {
    state.observe(this, this.state);
    console.log("init modal");
    this.content = Array.from(this.childNodes);
    this.trap = focusTrap.createFocusTrap(this, {
      onDeactivate: () => state.update({ $Slots: { open: false } }),
    });
  }

  template() {
    console.log(state());
    if (state(this.state)) {
      this.classList.add("open");
      this.trap.activate();
    } else {
      this.classList.remove("open");
      this.trap.deactivate();
    }
    return html`<div>${this.content}</div>`;
  }
}

customElements.define("a-modal-dialog", AModalDialog);
