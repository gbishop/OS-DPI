import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

class Gap extends Base {
  static defaultProps = { scale: "1", background: "" };

  template() {
    const style = styleString({
      flexGrow: this.props.scale,
      backgroundColor: this.props.background,
    });
    return html`<div class="gap flex" style=${style}></div>`;
  }
}

componentMap.addMap("gap", Gap);
