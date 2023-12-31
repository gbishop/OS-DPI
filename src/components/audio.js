import { TreeBase } from "./treebase";
import * as Props from "./props";
import db from "app/db";
import { html } from "uhtml";

import Globals from "app/globals";

class Audio extends TreeBase {
  stateName = new Props.String("$Audio");

  async playAudio() {
    const { state } = Globals;
    const fileName = state.get(this.stateName.value) || "";
    (await db.getAudio(fileName)).play();
  }

  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      this.playAudio();
    }
    return html`<div />`;
  }
}
TreeBase.register(Audio, "Audio");
