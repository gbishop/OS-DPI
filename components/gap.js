import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/gap.css";
import { html } from "uhtml";

class Gap extends TreeBase {
  scale = new Props.Float(1);
  background = new Props.Color("");

  template() {
    return this.component(
      {
        style: styleString({
          backgroundColor: this.background.value,
        }),
      },
      html`<div />`,
    );
  }
}
TreeBase.register(Gap, "Gap");
