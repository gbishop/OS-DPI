import { TreeBase } from "./treebase";
import * as Props from "./props";
import db from "app/db";
import { html } from "uhtml";

import Globals from "app/globals";

/** @param {string} filename */
export async function playAudio(filename) {
  const sound = await db.getAudio(filename);
  sound.play();
}

class Audio extends TreeBase {
  stateName = new Props.String("$Audio");

  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      const filename = state.get(this.stateName.value) || "";
      playAudio(filename);
    }
    return html`<div />`;
  }
}
TreeBase.register(Audio, "Audio");
