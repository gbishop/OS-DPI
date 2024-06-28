import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import "css/display.css";
import Globals from "app/globals";
import { formatSlottedString, hasSlots } from "./slots";
import { formatNote } from "./notes";

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
    console.log("click");
    /**
     * @param {HTMLElement} root
     * @param {Selection} s
     * @returns {number}
     */
    function getOffsetToSelection(root, s) {
      const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

      let offset = 0;
      while (treeWalker.nextNode()) {
        const node = /** @type {Text} */ (treeWalker.currentNode);
        if (node == s.focusNode) {
          console.log("got node", offset, s.focusOffset);
          return offset + s.focusOffset;
        }
        console.log("over", node, node.data, node.data.length);
        offset += node.data.length;
      }
      return -1;
    }
    const s = window.getSelection();
    console.log({ s });
    if (!s) return;
    let element = document.getElementById(this.id);
    console.log({ element });
    if (!element) {
      return;
    }
    element = element.querySelector("button");
    if (!element) {
      return;
    }
    if (!element.contains(s.anchorNode)) {
      console.log("selection not inside");
      return;
    }
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
    this.current?.setAttribute(
      "data--clicked-caret",
      getOffsetToSelection(element, s).toString(),
    );
    s.empty();
  };

  /**
   * @param {SpeechSynthesisEvent} event
   */
  handleEvent(event) {
    /**
     * @param {HTMLElement} root
     * @param {number} offset
     * @returns {[Text|null, number]}
     */
    function getNodeAtOffset(root, offset) {
      const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

      while (treeWalker.nextNode()) {
        const node = /** @type {Text} */ (treeWalker.currentNode);
        if (node.parentElement instanceof HTMLSpanElement) {
          const it = node.data;
          if (offset > it.length) {
            offset -= it.length;
          } else {
            return [node, offset];
          }
        }
      }
      return [null, -1];
    }
    if (!this.highlightWords.value) {
      return;
    }
    const element = document.getElementById(this.id);
    if (!element) {
      return;
    }
    const span = element.querySelector("button span");
    if (!span) {
      return;
    }
    const [text, offset] = getNodeAtOffset(element, event.charIndex);
    if (!text) {
      return;
    }
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    if (event.type == "boundary") {
      try {
        selection.setBaseAndExtent(text, offset, text, offset);
        selection.modify("extend", "forward", "word");
      } catch (e) {
        console.error(e);
      }
    } else if (event.type == "end") {
      selection.empty();
      if (this.clearAfterSpeaking.value) {
        Globals.state.update({ [this.stateName.value]: "" });
      }
    }
  }

  init() {
    document.addEventListener("boundary", this);
    document.addEventListener("end", this);
  }
}
TreeBase.register(Display, "Display");
