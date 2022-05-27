import { log } from "../log.js";
import { strip } from "./display.js";
import { Base, componentMap } from "./base.js";
import { html } from "../_snowpack/pkg/uhtml.js";
import db from "../db.js";

class Audio extends Base {
  static defaultProps = {
    stateName: "$Audio",
  };

  async playAudio() {
    const { state } = Globals;
    const { stateName } = this.props;
    const fileName = strip(state.get(stateName) || "");
    log("play audio");
    (await db.getAudio(fileName)).play();
  }

  template() {
    const { stateName } = this.props;
    const { state } = Globals;
    if (state.hasBeenUpdated(stateName)) {
      this.playAudio();
    }
    return html``;
  }
}

componentMap.addMap("audio", Audio);
