import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { styleString } from "./style";

export class Stack extends Base {
  static defaultProps = { direction: "column", background: "", scale: "1" };
  static allowedChildren = [
    "stack",
    "grid",
    "display",
    "radio",
    "tab control",
    "vsd",
    "button",
  ];

  template() {
    const style = styleString({
      backgroundColor: this.props.background,
    });
    const empty = this.children.length ? "" : "empty";
    const scaleSum = this.children.reduce(
      (sum, child) => sum + +child.props.scale,
      0
    );
    const dimension = this.props.direction == "row" ? "width" : "height";
    return html`<div
      id=${this.id}
      class=${`stack flex ${this.props.direction} ${empty}`}
      style=${style}
    >
      ${this.children.map(
        (child) =>
          html`<div
            style=${styleString({
              [dimension]: `${(100 * +child.props.scale) / scaleSum}%`,
            })}
          >
            ${child.template()}
          </div>`
      )}
    </div>`;
  }

  get name() {
    return this.props.name || this.props.direction;
  }
}
componentMap.addMap("stack", Stack);
