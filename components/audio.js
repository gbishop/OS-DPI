import { log } from "../log";
import { strip } from "./display";
import { Base, componentMap } from "./base";
import { html } from "uhtml";
import db from "../db";

class Audio extends Base {
  static defaultProps = {
    stateName: "$Audio",
  };

  async playAudio() {
    const { state } = this.context;
    const { stateName } = this.props;
    const fileName = strip(state.get(stateName) || "");
    log("play audio");
    (await db.getAudio(fileName)).play();
  }

  template() {
    const { stateName } = this.props;
    const { state } = this.context;
    if (state.hasBeenUpdated(stateName)) {
      this.playAudio();
    }
    return html``;
  }
}

componentMap.addMap("audio", Audio);