import { Base, componentMap } from "./base";
import { html } from "uhtml";
import { styleString } from "./style";
import { log } from "../log.js"

export class Logger extends Base {

  static defaultProps = {
    stateName: "$Logger"
  };

  stringifyInput(array) {
    let output = '';
    let length = array.length;

    for(let i = 0; i < length; i+=2)
      output += array[i] + " \"" + (i+1 < length ? array[i+1] : "") + "\"\n";

    return output;
  }

  template() {
    const { stateName } = this.props;
    const { state } = this.context;

    if(state.hasBeenUpdated(stateName)) {
      console.log(state.interpolate(this.stringifyInput(state.get(stateName))));
    }

    return html``;
  }
}

componentMap.addMap("logger", Logger);
