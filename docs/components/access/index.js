import { html } from "../../_snowpack/pkg/uhtml.js";
import { Base } from "../base.js";
import { TabControl, TabPanel } from "../tabcontrol.js";
import { AccessMethod } from "./method/index.js";
import { AccessPattern, Group } from "./pattern/index.js";
import { AccessCues } from "./cues/index.js";
import { extender } from "../../_snowpack/pkg/proxy-pants.js";

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

const EventWrapProto = {
  access: {},
};

export const EventWrap = extender(EventWrapProto);

/**
 * Provide a ref to update the map
 *
 * @param {Object} data
 * @returns {function(Node)}
 */
export function UpdateAccessData(data) {
  return (node) => {
    const button = ButtonWrap(node);
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
