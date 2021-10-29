import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

class Gap extends Base {
  static defaultProps = { scale: "1", background: "" };

  template() {
    const style = styleString({
      backgroundColor: this.props.background,
    });
    return html`<div class="gap flex" style=${style} id=${this.id}></div>`;
  }
}

componentMap.addMap("gap", Gap);
