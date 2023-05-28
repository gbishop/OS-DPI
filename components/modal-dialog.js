import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import "css/modal-dialog.css";

import Globals from "app/globals";

export class ModalDialog extends TreeBase {
  stateName = new Props.String("$modalOpen");
  open = new Props.Boolean(false);

  allowedChildren = ["Stack"];

  template() {
    const state = Globals.state;
    const { stateName } = this.props;
    const open = !!state.get(stateName) || this.open.value ? "open" : "";
    if (open) {
      return this.component(
        { classes: [open] },
        html`<div>${this.children.map((child) => child.safeTemplate())}</div>`
      );
    } else {
      return this.empty;
    }
  }
}
TreeBase.register(ModalDialog, "ModalDialog");
