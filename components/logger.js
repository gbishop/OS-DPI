import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { styleString } from "./style";

export class Logger extends Base {
  static defaultProps = {
    stateName: "$Logger",
    states: []
  };

  template() {
    return html``;
  }
}
componentMap.addMap("logger", Logger);
