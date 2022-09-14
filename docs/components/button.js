import { html } from "../_snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";
import css from "../_snowpack/pkg/ustyler.js";
import { UpdateAccessData } from "./access/index.js";

class Button extends Base {
  static defaultProps = {
    label: "click me",
    name: "button",
    background: "",
    scale: "1",
  };

  template() {
    const style = styleString({ backgroundColor: this.props.background });
    const { rules } = Globals;
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
