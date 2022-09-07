import { html } from "uhtml";
import { Base } from "../../base";
import { TreeBase, TreeBaseSwitchable } from "../../treebase";
import { String, TypeSelect, UID, TextArea } from "../../props";
import db from "../../../db";
import Globals from "../../../globals";

export class AccessCues extends Base {
  template() {
    return html`<div class="access-cues">
      <h1>Cues</h1>
      ${Globals.cues.template()}
    </div>`;
  }
}

class Cue extends TreeBaseSwitchable {
  Name = new String("a cue");
  Key = new UID();
  CueType = new TypeSelect(CueTypes);

  template() {
    return html`
      <div class="Cue">
        ${this.Name.input()} ${this.CueType.input()} ${this.subTemplate()}
        ${this.deleteButton({ title: "Delete this cue" })}
      </div>
    `;
  }

  subTemplate() {
    return html`<!--empty-->`;
  }

  renderCss() {
    return html`<!--empty-->`;
  }
}
TreeBase.register(Cue);

export class CueList extends TreeBase {
  /** @type {Cue[]} */
  children = [];

  template() {
    return html`<div class="CueList">
      ${this.addChildButton("+Cue", Cue, { title: "Add a Cue" })}
      ${this.unorderedChildren()}
    </div>`;
  }

  renderCss() {
    return this.children.map((child) => child.renderCss());
  }

  get cueMap() {
    return new Map(
      this.children.map((child) => [child.Key.value, child.Name.value])
    );
  }

  /**
   * Load the CueList from the db
   * @returns {Promise<CueList>}
   */
  static async load() {
    const fallback = {
      className: "CueList",
      props: {},
      children: [],
    };
    const list = await db.read("cues", fallback);
    const result = /** @type {CueList} */ (this.fromObject(list));
    return result;
  }

  onUpdate() {
    console.log("update cues", this);
    db.write("cues", this.toObject());
    Globals.state.update();
  }
}
TreeBase.register(CueList);

const CueTypes = new Map([
  ["Cue", "none"],
  ["CueCss", "css"],
]);

class CueCss extends Cue {
  Code = new TextArea("", {
    hiddenLabel: true,
    placeholder: "Enter CSS for this cue",
  });

  subTemplate() {
    return this.Code.input();
  }

  renderCss() {
    return html`<style>
      ${this.Code.value}
    </style>`;
  }
}
TreeBase.register(CueCss);
