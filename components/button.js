import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

class Button extends Base {
  static defaultProps = {
    text: "click me",
    name: "button",
    background: "",
  };

  template() {
    const style = styleString({ backgroundColor: this.props.background });
    const { rules } = this.context;
    return html`<button
      name=${this.props.name}
      style=${style}
      onClick=${rules.handler(this.props.name, {}, "press")}
    >
      ${this.props.label}
    </button>`;
  }

  getChildren() {
    return [];
  }
}

componentMap["button"] = Button;
