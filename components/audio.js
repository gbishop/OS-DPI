import { log } from "../log";
import { strip } from "./display";
import { Base, componentMap } from "./base";
import { html } from "uhtml";
import db from "../db";

import Globals from "../globals";

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

  uiTemplate() {
    const { stateName } = this.props;
    const { state } = Globals;
    if (state.hasBeenUpdated(stateName)) {
      this.playAudio();
    }
    return html`<!--empty-->`;
  }
}

componentMap.addMap("audio", Audio);
