/* Allow signaling that a button has changed since last render */
export let AccessChanged = false;

export function clearAccessChanged() {
  AccessChanged = false;
}
