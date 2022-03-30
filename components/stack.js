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
    /** return the scale of the child making sure it isn't zero or undefined.
     * @param {Base} child
     * @returns {number}
     */
    function getScale(child) {
      const SCALE_MIN = 0.1;
      let scale = +child.props.scale;
      if (!scale || scale < SCALE_MIN) {
        scale = SCALE_MIN;
      }
      return scale;
    }
    const empty = this.children.length ? "" : "empty";
    const scaleSum = this.children.reduce(
      (sum, child) => sum + getScale(child),
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
              [dimension]: `${(100 * getScale(child)) / scaleSum}%`,
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
