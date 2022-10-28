import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";

class Gap extends TreeBase {
  scale = new Props.Float(1);
  background = new Props.Color("");

  uiTemplate() {
    const style = styleString({
      backgroundColor: this.props.background,
    });
    return html`<div class="gap flex" style=${style} id=${this.id}></div>`;
  }
}
TreeBase.register(Gap, "Gap");
