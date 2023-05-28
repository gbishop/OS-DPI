import { strip } from "./display";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import db from "app/db";

import Globals from "app/globals";

class Audio extends TreeBase {
  stateName = new Props.String("$Audio");

  async playAudio() {
    const { state } = Globals;
    const { stateName } = this.props;
    const fileName = strip(state.get(stateName) || "");
    (await db.getAudio(fileName)).play();
  }

  template() {
    const { stateName } = this.props;
    const { state } = Globals;
    if (state.hasBeenUpdated(stateName)) {
      this.playAudio();
    }
    return this.empty;
  }
}
TreeBase.register(Audio, "Audio");
