import { StackContainer } from "./stack";

export class Page extends StackContainer {
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
      "HeadMouse",
    );
  }
}
StackContainer.register(Page, "Page");
