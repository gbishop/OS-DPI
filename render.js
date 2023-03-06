import { render } from "uhtml";

/** @type {Function[]} */
const PostRenderFunctions = [];
/** @param {Function} f */
export function callAfterRender(f) {
  PostRenderFunctions.push(f);
}

const safe = false;

/** @param {Element} where
 * @param {Hole} what
 */
export function safeRender(where, what) {
  let r;
  if (safe) {
    try {
      r = render(where, what);
    } catch (error) {
      console.log("crash", error);
      window.location.reload();
      return;
    }
  } else {
    r = render(where, what);
  }
  while (PostRenderFunctions.length > 0) {
    const PRF = PostRenderFunctions.pop();
    if (PRF) PRF();
  }
  return r;
}
