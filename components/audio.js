import { strip } from "./display";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { html } from "uhtml";
import db from "app/db";

import Globals from "app/globals";

class Audio extends TreeBase {
  stateName = new Props.String("$Audio");

  async playAudio() {
    const { state } = Globals;
    const { stateName } = this.props;
    const fileName = strip(state.get(stateName) || "");
    console.log("play audio");
    (await db.getAudio(fileName)).play();
  }

  template() {
    const { stateName } = this.props;
    const { state } = Globals;
    if (state.hasBeenUpdated(stateName)) {
      this.playAudio();
    }
    return html`<!--empty-->`;
  }
}
TreeBase.register(Audio, "Audio");
