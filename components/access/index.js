import { extender } from "proxy-pants";

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
