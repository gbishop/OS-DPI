import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

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
      onClick=${rules.handler(this.props.name, {}, "press")}
    >
      ${this.props.label}
    </button>`;
  }

  getChildren() {
    return [];
  }
}

componentMap.addMap("button", Button);
