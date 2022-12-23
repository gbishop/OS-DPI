import { html } from "uhtml";
// import "css/customize.css";
import { TreeBase } from "components/treebase";
import * as Props from "components/props";

/**
 * Convert CamelCase to dash-style.
 *
 * @param {string} camel
 * @returns {string}
 */
function camelToDash(camel) {
  return camel.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Edit a single CSS rule replacing our #field selectors with dash-style and prefixing #UI
 *
 * @param {string} selector
 * @param {string} body
 * @returns {string}
 */
function editCSSRule(selector, body) {
  selector = selector.replace(
    /#(\w+)/g,
    (_, name) => `data-${camelToDash(name)}`
  );
  return `#UI ${selector} {${body}}\n`;
}
/**
 * Edit user entered CSS
 *
 * @param {string} text
 * @returns {string}
 */
function editCSS(text) {
  return text.replace(/\s*([\s\S]*?){([\s\S]*?)}/g, (_, selector, body) =>
    editCSSRule(selector, body)
  );
}

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
    const content = editCSS(this.css.value);
    return html`<style>
      ${content}
    </style>`;
  }
}
TreeBase.register(Customize, "Customize");
