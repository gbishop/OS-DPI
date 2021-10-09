import { html } from "uhtml";
import { BaseComponent, ComponentMap } from "./base";
import { styleString } from "./style";

class ButtonComponent extends BaseComponent {
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
      ${this.props.text}
    </button>`;
  }

  getChildren() {
    return [];
  }
}

ComponentMap["button"] = ButtonComponent;
