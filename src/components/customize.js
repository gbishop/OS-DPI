import { html } from "uhtml";
// import "css/customize.css";
import { TreeBase } from "components/treebase";
import * as Props from "components/props";

/**
 * Customize component allows modifying the CSS of the UI to
 * adjust colors, size and placement of elements.
 */
export class Customize extends TreeBase {
  name = new Props.String("Style");
  css = new Props.Code("", { placeholder: "Enter CSS", label: "CSS" });

  /** @type {string[]} */
  allowedChildren = [];

  template() {
    return html`<style>
      ${this.css.editedValue}
    </style>`;
  }
}
TreeBase.register(Customize, "Customize");
