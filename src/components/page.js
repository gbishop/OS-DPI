import { Stack } from "./stack";

export class Page extends Stack {
  // you can't delete the page
  allowDelete = false;

  constructor() {
    super();
    this.allowedChildren = this.allowedChildren.concat(
      "Speech",
      "Audio",
      "Logger",
      "ModalDialog",
      "Customize",
      "HeadMouse"
    );
  }
}
Stack.register(Page, "Page");
