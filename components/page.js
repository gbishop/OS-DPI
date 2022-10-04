import { html } from "uhtml";
import { TreeBase } from "./treebase";
import db from "../db";
import Globals from "../globals";

const emptyPage = {
  className: "Page",
  props: {},
  children: [
    {
      className: "Speech",
      props: {},
      children: [],
    },
  ],
};

export class Page extends TreeBase {
  allowedChildren = ["stack", "modal dialog", "speech", "audio", "logger"];

  template() {
    console.log("Page template");
    return html`${this.children.map((child) => child.template())}`;
  }

  static async load() {
    const page = await db.read("layout", emptyPage);
    const result = /** @type {Page} */ (this.fromObject(page));
    return result;
  }

  onUpdate() {
    console.log("update layout", this);
    db.write("layout", this.toObject());
    Globals.state.update();
  }
}
TreeBase.register(Page);
