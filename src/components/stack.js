import { TreeBase } from "./treebase";
import * as Props from "./props";
import { html } from "uhtml";
import { styleString } from "./style";
import "css/stack.css";

export class Stack extends TreeBase {
  direction = new Props.Select(["row", "column"], { defaultValue: "column" });
  background = new Props.Color("");
  scale = new Props.Float(1);

  allowedChildren = [
    "Stack",
    "Gap",
    "Grid",
    "Display",
    "Radio",
    "TabControl",
    "VSD",
    "Button",
  ];

  /** @returns {Hole|Hole[]} */
  template() {
    /** return the scale of the child making sure it isn't zero or undefined.
     * @param {TreeBase} child
     * @returns {number}
     */
    function getScale(child) {
      const SCALE_MIN = 0.0;
      let scale = +child.props.scale;
      if (!scale || scale < SCALE_MIN) {
        scale = SCALE_MIN;
      }
      return scale;
    }
    const scaleSum = this.children.reduce(
      (sum, child) => sum + getScale(child),
      0
    );
    const empty = this.children.length && scaleSum ? "" : "empty";
    const dimension = this.props.direction == "row" ? "width" : "height";

    return this.component(
      {
        classes: [this.props.direction, empty],
        style: {
          backgroundColor: this.props.background,
        },
      },
      this.children.map(
        (child) =>
          html`<div
            style=${styleString({
              [dimension]: `${(100 * getScale(child)) / scaleSum}%`,
            })}
          >
            ${child.safeTemplate()}
          </div>`
      )
    );
  }
}
TreeBase.register(Stack, "Stack");
