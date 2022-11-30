import { html } from "uhtml";
import "css/cues.css";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import { TabPanel } from "components/tabcontrol";
import * as Props from "components/props";

import db from "app/db";
import Globals from "app/globals";
import { interpolate } from "components/helpers";
import { getColor } from "components/style";
import defaultCues from "./defaultCues";

export class CueList extends TabPanel {
  name = new Props.String("Cues");

  allowedChildren = ["CueCSS", "CueOverlay"];
  /** @type {Cue[]} */
  children = [];

  allowDelete = false;

  template() {
    return html`<div class="CueList" id=${this.id} tabindex="-1" >
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
    db.write("cues", this.toObject());
    Globals.state.update();
  }
}
TreeBase.register(CueList, "CueList");

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

  settings() {
    return html`
      <fieldset class="Cue">
        ${this.Name.input()} ${this.CueType.input()} ${this.subTemplate()}
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
      ${interpolate(this.css, this.props)}
    </style>`;
  }
}
TreeBase.register(Cue, "Cue");

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
TreeBase.register(CueCss, "CueCss");

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
TreeBase.register(CueOverlay, "CueOverlay");

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
TreeBase.register(CueFill, "CueFill");

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
    const props = this.props;
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
TreeBase.register(CueCircle, "CueCircle");
