import { Stack } from "./stack";
import db from "app/db";

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

  static async load() {
    const page = await db.read("layout", emptyPage);
    const result = /** @type {Page} */ (this.fromObject(page));
    return result;
  }
}
Stack.register(Page, "Page");
