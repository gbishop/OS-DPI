import { Group } from "./pattern/index.js";
import { extender } from "../../_snowpack/pkg/proxy-pants.js";
import equal from "../../_snowpack/pkg/fast-deep-equal.js";

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
