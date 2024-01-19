import { html } from "uhtml";
import { TreeBase } from "./treebase";
import { Stack } from "./stack";
import * as Props from "./props";
import "css/modal-dialog.css";

import Globals from "app/globals";

export class ModalDialog extends Stack {
  stateName = new Props.String("$modalOpen");
  open = new Props.Boolean(false);

  // allowedChildren = ["Stack"];

  /** @param {string[]} classes */
  CSSClasses(...classes) {
    return super.CSSClasses("open", ...classes);
  }

  template() {
    const state = Globals.state;
    const open =
      !!state.get(this.stateName.value) || this.open.value ? "open" : "";
    if (open) {
      return super.template();
    } else {
      return html`<div />`;
    }
  }
}
TreeBase.register(ModalDialog, "ModalDialog");
