import { html } from "uhtml";
import "css/cues.css";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import { DesignerPanel } from "components/designer";
import * as Props from "components/props";

import { toggleIndicator } from "components/helpers";
import { getColor } from "components/style";
import defaultCues from "./defaultCues";

export class CueList extends DesignerPanel {
  name = new Props.String("Cues");

  static tableName = "cues";
  static defaultValue = defaultCues;

  allowedChildren = ["CueCss", "CueFill", "CueOverlay", "CueCircle"];
  /** @type {Cue[]} */
  children = [];

  allowDelete = false;

  settings() {
    return html`<div class="CueList" id=${this.id}>
      ${this.unorderedChildren()}
    </div>`;
  }

  /** @returns {Hole|Hole[]} */
  template() {
    const result = this.children.map(
      (child) =>
        html`<style>
          ${child.css}
        </style>`
    );
    if (this.children.length > 0) {
      const defaultCue = this.defaultCue;
      const defaultCSS = defaultCue.css.replaceAll(
        defaultCue.Key.value,
        "DefaultCue"
      );
      result.push(
        html`<style>
          ${defaultCSS}
        </style>`
      );
    }
    return result;
  }

  get cueMap() {
    /** @type {[string,string][]} */
    const entries = this.children.map((child) => [
      child.Key.value,
      child.Name.value,
    ]);
    entries.unshift(["DefaultCue", "Default Cue"]);
    return new Map(entries);
  }

  get defaultCue() {
    return this.children.find((cue) => cue.Default.value) || this.children[0];
  }

  /** @param {Object} obj */
  static upgrade(obj) {
    // update any CueCss entries to the new style interpolation
    if (obj.className == "CueList") {
      for (const child of obj.children) {
        if (child.className == "CueCss") {
          child.props.Code = child.props.Code.replaceAll("{{Key}}", "$Key");
        }
      }
    }
    return obj;
  }
}
TreeBase.register(CueList, "CueList");

const CueTypes = new Map([
  ["Cue", "none"],
  ["CueOverlay", "overlay"],
  ["CueFill", "fill"],
  ["CueCss", "css"],
  ["CueCircle", "circle"],
]);

class Cue extends TreeBaseSwitchable {
  Name = new Props.String("a cue");
  Key = new Props.UID();
  CueType = new Props.TypeSelect(CueTypes);
  Default = new Props.OneOfGroup(false, { name: "DefaultCue" });

  settingsSummary() {
    return html`<h3>
      ${this.Name.value} ${toggleIndicator(this.Default.value, "Default cue")}
    </h3>`;
  }

  settingsDetails() {
    return html`<div class="Cue">
      ${this.Name.input()} ${this.Default.input()} ${this.CueType.input()}
      ${this.subTemplate()}
    </div>`;
  }

  /** @returns {Hole[]} */
  subTemplate() {
    return [this.empty];
  }

  get css() {
    return "";
  }
}
TreeBase.register(Cue, "Cue");

class CueCss extends Cue {
  Code = new Props.Code("", {
    placeholder: "Enter CSS for this cue",
    hiddenLabel: true,
  });

  subTemplate() {
    return [this.Code.input()];
  }

  get css() {
    return this.Code.editedValue;
  }

  onUpdate() {
    this.Code.editCSS(this.props);
  }

  init() {
    this.onUpdate();
  }
}
TreeBase.register(CueCss, "CueCss");

class CueOverlay extends Cue {
  Color = new Props.Color("yellow");
  Opacity = new Props.Float(0.3);

  subTemplate() {
    return [this.Color.input(), this.Opacity.input(),
      html`<details>
        <summary>generated CSS</summary>
        <pre><code>${this.css.replaceAll(this.Key.value, "$Key")}</code></pre>
      </details>`];
  }

  get css() {
    return `
#UI button[cue="${this.Key.value}"] {
        position: relative;
        border-color: ${getColor(this.Color.value)};
      }
#UI button[cue="${this.Key.value}"]:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${getColor(this.Color.value)};
        opacity: ${this.Opacity.value};
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
    return [this.Color.input(), this.Opacity.input(),
      this.Direction.input(), this.Repeat.input(),
      html`<details>
        <summary>generated CSS</summary>
        <pre><code>${this.css.replaceAll(this.Key.value, "$Key")}</code></pre>
      </details>`];
  }

  get css() {
    return `
      button[cue="${this.Key.value}"] {
        position: relative;
        border-color: ${getColor(this.Color.value)};
      }
      button[cue="${this.Key.value}"]:after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;

        background-color: ${getColor(this.Color.value)};
        opacity: ${this.Opacity.value};
        z-index: 10;
        animation-name: ${this.Key.value};
        animation-duration: var(--timerInterval);
        animation-timing-function: linear;
        animation-iteration-count: ${this.Repeat.value ? "infinite" : 1};
      }
      @keyframes ${this.Key.value} {
        0% { ${this.Direction.value}: 100%; }
      100% { ${this.Direction.value}: 0%; }
      }
    `;
  }
}
TreeBase.register(CueFill, "CueFill");

class CueCircle extends Cue {
  Color = new Props.Color("lightblue");
  Opacity = new Props.Float(0.3);

  subTemplate() {
    return [this.Color.input(), this.Opacity.input(),
      html`<details>
        <summary>generated CSS</summary>
        <pre><code>${this.css.replaceAll(this.Key.value, "$Key")}</code></pre>
      </details>`];
  }

  get css() {
    return `
@property --percent-${this.Key.value} {
  syntax: "<percentage>";
  initial-value: 100%;
  inherits: false;
}
button[cue="${this.Key.value}"] {
  position: relative;
  border-color: ${getColor(this.Color.value)};
}
button[cue="${this.Key.value}"]:after {
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
      ${getColor(this.Color.value)},
      ${getColor(this.Color.value)} var(--percent-${this.Key.value}),
    transparent var(--percent-${this.Key.value})
  );
  opacity: ${this.Opacity.value};

  animation-name: conic-gradient-${this.Key.value};
  animation-duration: var(--timerInterval);
  animation-timing-function: linear;

  z-index: 0;
}

@keyframes conic-gradient-${this.Key.value} {
  0% {
    --percent-${this.Key.value}: 0%;
  }

  100% {
    --percent-${this.Key.value}: 100%;
  }
}
    `;
  }
}
TreeBase.register(CueCircle, "CueCircle");
