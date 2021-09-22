import { html } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import ATabPanel from "./a-tab-panel";

export default class ATabControl extends ABase {
  // defaults
  state = "a-tab-control";
  activeTab = "";
  background = "inherit";
  scale = 1;

  static observed = "state activeTab background scale";

  init() {
    // grab the tab panels from the content. They will be gone after the first
    // render
    /** @type {ATabPanel[]} */
    this.panels = Array.from(this.querySelectorAll("a-tab-panel"));
    state.define(
      this.state,
      this.activeTab || this.panels[0].getAttribute("name") // props not yet available
    );
    state.observe(this, this.state);
  }

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
    const buttons = this.panels
      .filter((panel) => panel.label != "UNLABELED")
      .map((panel) => {
        const tabName = state.interpolate(panel.name); // internal name
        const tabLabel = state.interpolate(panel.label || panel.name); // display name
        const color = panel.background;
        const active = state(this.state) == tabName;
        const style = active
          ? `background-color: ${color};border-top-color: ${color};`
          : "";
        panel.active = active;
        return html`<button
          style=${style}
          onClick=${() => state.update({ [this.state]: tabName })}
        >
          ${tabLabel}
        </button>`;
      });
    const panel = this.panels.find((panel) => panel.active);
    return html`<div class="panels" style=${`flex-grow: ${this.scale - 1}`}>
        ${panel}
      </div>
      <div class="buttons">${buttons}</div>`;
  }

  get designerChildren() {
    return this.panels;
  }
}
customElements.define("a-tab-control", ATabControl);
