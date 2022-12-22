import { html } from "uhtml";
import "css/custom-css.css";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import { DesignerPanel } from "components/designer";
import * as Props from "components/props";

import { interpolate, toggleIndicator } from "components/helpers";

const defaultCustomCss = {
  className: "CustomCssList",
  props: {},
  children: [
    {
      className: "CustomCss",
      props: {
        Name: "yellow overlay",
        // Key: "idl7qm4cs28fh2ogf4ni",
        Code: `
  button[cue="{{Key}}"] {
    position: relative;
    border-color: yellow;
  }
  button[cue="{{Key}}"]:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: yellow;
    opacity: 0.3;
    z-index: 10;
  }`,
      },
      children: [],
    }
  ],
};


export class CustomCssList extends DesignerPanel {
  name = new Props.String("Custom CSS");

  static tableName = "customCssTable";
  static defaultValue = defaultCustomCss;

  allowedChildren = ["customCss"];
  /** @type {CustomCss[]} */
  children = [];

  allowDelete = false;

  settings() {
    return html`<div class="CustomCssList" id=${this.id} tabindex="-1">
      ${this.unorderedChildren()}
    </div>`;
  }

  renderCss() {
    const result = this.children.map((child) => child.renderCss());
    return result;
  }
}
TreeBase.register(CustomCssList, "CustomCssList");

/**
 * Customize component allows modifying the CSS of the UI to
 * adjust colors, size and placement of elements.
 */
export class CustomCss extends TreeBase {
  Name = new Props.String("Style");
  Key = new Props.UID();
  Code = new Props.Code("", {
    placeholder: "Enter CSS for this cue",
    hiddenLabel: true,
  });

  /** @type {string[]} */
  allowedChildren = [];

  settingsSummary() {
    return html`<h3>
      ${this.Name.value}
    </h3>`;
  }

  settingsDetails() {
    return html`<div class="CustomCss">
      ${this.Name.input()}
      ${this.Code.input()}
    </div>`;
  }

  get css() {
    return this.Code.value;
  }

  renderCss(overrideProps = {}) {
    return html`<style>
      ${interpolate(this.css, { ...this.props, ...overrideProps })}
    </style>`;
  }
}
TreeBase.register(CustomCss, "CustomCss");