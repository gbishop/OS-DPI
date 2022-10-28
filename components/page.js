import { html } from "uhtml";
import { Stack } from "./stack";
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

export class Page extends Stack {
  // you can't delete the page
  allowDelete = false;

  constructor() {
    super();
    this.allowedChildren = this.allowedChildren.concat(
      "Speech",
      "Audio",
      "Logger"
    );
  }

  template() {
    return html`${this.children.map((child) => child.template())}`;
  }

  static async load() {
    const page = await db.read("layout", emptyPage);
    const result = /** @type {Page} */ (this.fromObject(page));
    return result;
  }

  onUpdate() {
    db.write("layout", this.toObject());
    Globals.state.update();
  }
}
Stack.register(Page, "Page");
