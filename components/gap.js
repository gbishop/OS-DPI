import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/gap.css";

class Gap extends TreeBase {
  scale = new Props.Float(1);
  background = new Props.Color("");

  template() {
    return this.component(
      {
        style: styleString({
          backgroundColor: this.props.background,
        }),
      },
      html`<!--empty-->`
    );
  }
}
TreeBase.register(Gap, "Gap");
