import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import "css/display.css";
import Globals from "app/globals";
import { formatSlottedString, hasSlots } from "./slots";
import { formatNote, cursor } from "./notes";

class Display extends TreeBase {
  stateName = new Props.String("$Display");
  Name = new Props.String("");
  background = new Props.Color("white");
  fontSize = new Props.Float(2);
  scale = new Props.Float(1);
  highlightWords = new Props.Boolean(false);
  clearAfterSpeaking = new Props.Boolean(false);

  /** @type {HTMLDivElement | null} */
  current = null;

  static functionsInitialized = false;

  template() {
    const { state } = Globals;
    let value = state.get(this.stateName.value) || "";
    const content =
      (hasSlots(value) && formatSlottedString(value)) || formatNote(value);
    return this.component(
      {
        style: {
          backgroundColor: this.background.value,
          fontSize: this.fontSize.value + "rem",
        },
      },
      // prettier-ignore
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
      >${content}</button>`,
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

  /**
   * @param {SpeechSynthesisEvent} event
   */
  handleEvent(event) {
    console.log(event);
    if (!this.highlightWords.value) return;
    const element = document.getElementById(this.id);
    if (!element) return;
    const span = element.querySelector("button span");
    if (!span) return;
    const text = span.firstChild;
    if (!text) return;
    const selection = window.getSelection();
    if (!selection) return;

    if (event.type == "boundary") {
      try {
        selection.setBaseAndExtent(
          text,
          event.charIndex,
          text,
          event.charIndex,
        );
        selection.modify("extend", "forward", "word");
      } catch (e) {}
    } else if (event.type == "end") {
      console.log("end");
      Globals.state.update({ [this.stateName.value]: "" });
    }
  }

  init() {
    document.addEventListener("boundary", this);
    document.addEventListener("end", this);
  }
}
TreeBase.register(Display, "Display");
