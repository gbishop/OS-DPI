import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import "css/display.css";
import Globals from "app/globals";
import { formatSlottedString } from "./slots";

class Display extends TreeBase {
  stateName = new Props.String("$Display");
  Name = new Props.String("");
  background = new Props.Color("white");
  fontSize = new Props.Float(2);
  scale = new Props.Float(1);

  /** @type {HTMLDivElement | null} */
  current = null;

  static functionsInitialized = false;

  template() {
    const { state } = Globals;
    let value = state.get(this.stateName.value) || "";
    const content = formatSlottedString(value);
    return this.component(
      {
        style: {
          backgroundColor: this.background.value,
          fontSize: this.fontSize.value + "rem",
        },
      },
      html`<button
        ref=${this}
        @pointerup=${this.click}
        tabindex="-1"
        ?disabled=${!this.Name.value}
        data=${{
          name: this.Name.value,
          ComponentName: this.Name.value,
          ComponentType: this.className,
        }}
      >
        ${content}
      </button>`,
    );
  }

  /** Attempt to locate the word the user is touching
   */
  click = () => {
    const s = window.getSelection();
    if (!s) return;
    let word = "";
    if (s.isCollapsed) {
      s.modify("move", "forward", "character");
      s.modify("move", "backward", "word");
      s.modify("extend", "forward", "word");
      word = s.toString();
      s.modify("move", "forward", "character");
    } else {
      word = s.toString();
    }
    this.current?.setAttribute("data--clicked-word", word);
  };
}
TreeBase.register(Display, "Display");
