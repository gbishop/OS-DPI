import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";
import css from "ustyler";
import { UpdateAccessData } from "./access";

class Button extends Base {
  static defaultProps = {
    label: "click me",
    name: "button",
    background: "",
    scale: "1",
  };

  template() {
    const style = styleString({ backgroundColor: this.props.background });
    const { rules } = this.context;
    return html`<button
      class="button"
      name=${this.props.name}
      style=${style}
      id=${this.id}
      ref=${UpdateAccessData({
        name: this.props.name,
        label: this.props.label,
        component: "button",
      })}
    >
      ${this.props.label}
    </button>`;
  }

  getChildren() {
    return [];
  }
}

componentMap.addMap("button", Button);

css`
  button.button {
    height: 100%;
    width: 100%;
  }
`;
