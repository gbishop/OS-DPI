import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import css from "ustyler";
import { UpdateAccessData } from "./access";

class Button extends TreeBase {
  label = new Props.String("click me");
  name = new Props.String("button");
  background = new Props.Color("");
  scale = new Props.Float(1);

  template() {
    const style = styleString({ backgroundColor: this.props.background });
    const { name, label } = this.props;
    return html`<button
      class="button"
      name=${name}
      style=${style}
      id=${this.id}
      ref=${UpdateAccessData({
        name: name,
        label: label,
        ComponentName: this.props.name,
        ComponentType: this.constructor.name,
      })}
    >
      ${label}
    </button>`;
  }

  getChildren() {
    return [];
  }
}
TreeBase.register(Button, "Button");

css`
  button.button {
    height: 100%;
    width: 100%;
  }
`;
