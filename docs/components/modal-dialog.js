import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";

export class ModalDialog extends Base {
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
      <div>${this.children.map((child) => child.template())}</div>
    </div>`;
  }
}

componentMap.addMap("modal dialog", ModalDialog);
