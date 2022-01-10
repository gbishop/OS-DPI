import { html } from "../snowpack/pkg/uhtml.js";
import { Base, componentMap } from "./base.js";
import { styleString } from "./style.js";

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
