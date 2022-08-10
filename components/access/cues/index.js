import { html } from "uhtml";
import { Base } from "../../base";
import { TreeBase } from "../../treebase";
import { Select, String, UID } from "../../props";

export class AccessCues extends Base {
  template() {
    return html`<div class="access-cues">
      <h1>Cues</h1>
    </div>`;
  }
}

class CueList extends TreeBase {
  /** @type {CueChooser[]} */
  children = [];

  template() {
    return this.unorderedChildren();
  }
}

class CueChooser extends TreeBase {
  props = {
    Name: new String("a cue"),
    Key: new UID(),
    Type: new Select(CueMap),
  };

  /** @type {Cue[]} */
  children = [];

  template() {
    return html`<fieldset class="CueChooser"></fieldset>`;
  }
}

class Cue extends TreeBase {
  title = "A cue";
}
