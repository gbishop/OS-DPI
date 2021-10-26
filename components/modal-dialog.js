import { html } from "uhtml";
import { Base, componentMap } from "./base";
import * as focusTrap from "focus-trap";

class ModalDialog extends Base {
  /** @type {Props} */
  static defaultProps = {
    stateName: "$modalOpen",
  };
  static allowedChildren = ["stack"];

  template() {
    const state = this.context.state;
    return html`<div
      class="modal"
      id=${this.id}
      ?open=${!!state.get(this.props.stateName)}
    >
      ${this.children.map((child) => child.template())}
    </div>`;
  }
}

componentMap.addMap("modal dialog", ModalDialog);
