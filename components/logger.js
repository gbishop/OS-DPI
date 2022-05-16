import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { styleString } from "./style";
import { log } from "../log.js"

export class Logger extends Base {

  static defaultProps = {
    stateName: "$Logger"
  };

  stringifyInput(state, array) {
    let output = [];
    let length = array.length;

    for(let i = 0; i < length; i+=2)
      output.push(state.interpolate(array[i] + (i+1 < length ? " " + array[i+1] : "")));

    return output
  }

  template() {
    const { stateName } = this.props;
    const { state } = this.context;

    if(state.hasBeenUpdated(stateName)) {
      let value = this.stringifyInput(state, state.get(stateName));
      log({ "timestamp": Date.now(), "value": value });
    }

    return html``;
  }
}

componentMap.addMap("logger", Logger);
