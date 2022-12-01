import { html } from "../../../_snowpack/pkg/uhtml.js";
import css from "../../../_snowpack/pkg/ustyler.js";
import { Base } from "../../base.js";
import { TreeBase, TreeBaseSwitchable } from "../../treebase.js";
import * as Props from "../../props.js";

import db from "../../../db.js";
import Globals from "../../../globals.js";
import { interpolate } from "../../helpers.js";
import { getColor } from "../../style.js";
import defaultCues from "./defaultCues.js";

export class AccessCues extends Base {
  template() {
    return html`<div class="access-cues">
      <h1>Cues</h1>
      ${Globals.cues.template()}
    </div>`;
  }
}

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
    const list = await db.read("cues", defaultCues);
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
  ["CueOverlay", "overlay"],
  ["CueFill", "fill"],
  ["CueCircle", "circle"],
]);

class Cue extends TreeBaseSwitchable {
  Name = new Props.String("a cue");
  Key = new Props.UID();
  CueType = new Props.TypeSelect(CueTypes);

  template() {
    return html`
      <fieldset class="Cue">
        ${this.Name.input()} ${this.CueType.input()}
        ${this.deleteButton({ title: "Delete this cue" })} ${this.subTemplate()}
      </fieldset>
    `;
  }

  subTemplate() {
    return html`<!--empty-->`;
  }

  get css() {
    return "";
  }

  renderCss() {
    return html`<style>
      ${interpolate(this.css, this.propsAsObject)}
    </style>`;
  }
}
TreeBase.register(Cue);

class CueCss extends Cue {
  Code = new Props.TextArea("", {
    placeholder: "Enter CSS for this cue",
    hiddenLabel: true,
  });

  subTemplate() {
    return html`<details>
      <summary>CSS</summary>
      ${this.Code.input()}
    </details>`;
  }

  get css() {
    return this.Code.value;
  }
}
TreeBase.register(CueCss);

class CueOverlay extends Cue {
  Color = new Props.Color("yellow");
  Opacity = new Props.Float(0.3);

  subTemplate() {
    return html` ${this.Color.input()} ${this.Opacity.input()}
      <details>
        <summary>generated CSS</summary>
        <pre><code>${this.css}</code></pre>
      </details>`;
  }

  get css() {
    return `
      button[cue="{{Key}}"] {
        position: relative;
        border-color: {{Color}};
      }
      button[cue="{{Key}}"]:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: {{Color}};
        opacity: {{Opacity}};
        z-index: 10;
      }
    `;
  }
}
TreeBase.register(CueOverlay);

const fillDirections = new Map([
  ["top", "up"],
  ["bottom", "down"],
  ["right", "left to right"],
  ["left", "right to left"],
]);
class CueFill extends Cue {
  Color = new Props.Color("blue");
  Opacity = new Props.Float(0.3);
  Direction = new Props.Select(fillDirections);
  Repeat = new Props.Boolean(false);

  subTemplate() {
    return html`${this.Color.input()} ${this.Opacity.input()}
      ${this.Direction.input()} ${this.Repeat.input()}
      <details>
        <summary>generated CSS</summary>
        <pre><code>${this.css}</code></pre>
      </details> `;
  }

  get css() {
    return `
      button[cue="{{Key}}"] {
        position: relative;
        border-color: {{Color}};
      }
      button[cue="{{Key}}"]:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;

        background-color: {{Color}};
        opacity: {{Opacity}};
        z-index: 10;
        animation-name: {{Key}};
        animation-duration: var(--timerInterval);
        animation-timing-function: linear;
        animation-iteration-count: ${this.Repeat.value ? "infinite" : 1};
      }
      @keyframes {{Key}} {
        0% { {{Direction}}: 100%; }
      100% { {{Direction}}: 0%; }
      }
    `;
  }
}
TreeBase.register(CueFill);

class CueCircle extends Cue {
  Color = new Props.Color("lightblue");
  Opacity = new Props.Float(0.3);

  subTemplate() {
    return html`${this.Color.input()} ${this.Opacity.input()}
      <details>
        <summary>generated CSS</summary>
        <pre><code>${this.css}</code></pre>
      </details> `;
  }

  renderCss() {
    const props = this.propsAsObject;
    props["Color"] = getColor(props["Color"]);
    return html`<style>
      ${interpolate(this.css, props)}
    </style>`;
  }

  get css() {
    return `
@property --percent-{{Key}} {
  syntax: "<percentage>";
  initial-value: 100%;
  inherits: false;
}
button[cue="{{Key}}"] {
  position: relative;
  border-color: {{Color}};
}
button[cue="{{Key}}"]:after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  -webkit-mask-image: radial-gradient(
    transparent,
    transparent 50%,
    #000 51%,
    #000 0
  );
  mask: radial-gradient(transparent, transparent 50%, #000 51%, #000 0);

  background-image: conic-gradient(
    from 0,
      {{Color}},
      {{Color}} var(--percent-{{Key}}),
    transparent var(--percent-{{Key}})
  );
  opacity: {{Opacity}};

  animation-name: conic-gradient-{{Key}};
  animation-duration: var(--timerInterval);
  animation-timing-function: linear;

  z-index: 0;
}

@keyframes conic-gradient-{{Key}} {
  0% {
    --percent-{{Key}}: 0%;
  }

  100% {
    --percent-{{Key}}: 100%;
  }
}
    `;
  }
}
TreeBase.register(CueCircle);

css`
  .Cue textarea {
    box-sizing: border-box;
    width: 100%;
    height: 6em;
  }
`;