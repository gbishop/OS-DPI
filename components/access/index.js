import { html } from "uhtml";
import { Base } from "../base";
import { TabControl, TabPanel } from "../tabcontrol";
import { AccessMethod } from "./method";
import { AccessPattern, Group } from "./pattern";
import { AccessCues } from "./cues";
import { extender } from "proxy-pants";
import equal from "fast-deep-equal";

const AccessProto = {
  access: {},
  node: null,
  /** @param {string} value */
  cue(value) {
    this.setAttribute("cue", value);
  },
  /** @type {Group[]} */
  groups: [],
};

/** Maintain data for each visible button in a WeakMap */
export const ButtonWrap = extender(AccessProto);

/** Carry access data along with Events */
const EventWrapProto = {
  access: {},
};
export const EventWrap = extender(EventWrapProto);

/* Allow signaling that a button has changed since last render */
export let AccessChanged = false;

export function clearAccessChanged() {
  AccessChanged = false;
}

/**
 * Provide a ref to update the map
 *
 * @param {Object} data
 * @returns {function(Node)}
 */
export function UpdateAccessData(data) {
  return (node) => {
    const UI = node instanceof HTMLElement && node.closest("div#UI") !== null;
    const button = ButtonWrap(node);
    const changed = UI && (!button.access || !equal(data, button.access));
    if (changed && !AccessChanged) {
      // console.log("changed", data, button.access, node);
      AccessChanged = true;
    }
    button.access = data;
    button.node = node;
  };
}

export class Access extends Base {
  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent) {
    super(props, parent);

    /** @type {TabControl} */
    const tabs = new TabControl(
      { scale: "10", tabEdge: "top", stateName: "accessTab" },
      this
    );

    const methodPanel = new TabPanel(
      {
        name: "Access Method",
        background: "cyanish white",
      },
      tabs
    );
    methodPanel.children = [new AccessMethod({}, methodPanel)];

    const patternPanel = new TabPanel(
      {
        name: "Access Pattern",
        background: "bluish white",
      },
      tabs
    );
    patternPanel.children = [new AccessPattern({}, patternPanel)];

    const cuePanel = new TabPanel(
      {
        name: "Access Cues",
        background: "magentaish white",
      },
      tabs
    );
    cuePanel.children = [new AccessCues({}, cuePanel)];

    tabs.children = [methodPanel, patternPanel, cuePanel];

    this.children = [tabs];
  }

  template() {
    return html`${this.children.map((child) => child.template())} `;
  }
}
