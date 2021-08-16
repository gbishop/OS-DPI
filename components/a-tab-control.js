import { html, render } from "uhtml";
import { state } from "../state";
import ABase from "./a-base";
import ATabPanel from "./a-tab-panel";

class ATabControl extends ABase {
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
  }

  template() {
    this.style.flexGrow = this.scale.toString();
    this.style.backgroundColor = this.background;
    const tabs = this.panels.map((panel) => panel.name || "No name");
    const labels = this.panels.map((panel) => panel.getAttribute("label"));
    const buttons = tabs.map((tab, i) => {
      tab = state.interpolate(tab);
      const color = this.panels[i].getAttribute("background");
      const active = state(this.state) == tab;
      const style = active
        ? `background-color: ${color};border-top-color: ${color};`
        : "";
      return html`<button
        style=${style}
        onClick=${() => state.update({ [this.state]: tab })}
      >
        ${state.interpolate(labels[i] || tab)}
      </button>`;
    });
    const current = state(this.state);
    const panel = this.panels.filter(
      (_, i) => current == state.interpolate(tabs[i])
    );
    return html`<div class="panels" style=${`flex-grow: ${this.scale - 1}`}>
        ${panel}
      </div>
      <div class="buttons">${buttons}</div>`;
  }
}
customElements.define("a-tab-control", ATabControl);
