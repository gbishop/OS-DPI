import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/button.css";

class Button extends TreeBase {
  label = new Props.String("click me");
  name = new Props.String("button");
  background = new Props.Color("");
  scale = new Props.Float(1);

  template() {
    const style = styleString({ backgroundColor: this.props.background });
    const { name, label } = this.props;
    return this.component(
      {},
      html`<button
        class="button"
        name=${name}
        style=${style}
        .dataset=${{
          name: name,
          label: label,
          ComponentName: this.props.name,
          ComponentType: this.constructor.name,
        }}
      >
        ${label}
      </button>`
    );
  }

  getChildren() {
    return [];
  }
}
TreeBase.register(Button, "Button");
