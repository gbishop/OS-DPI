import { render, html } from "uhtml";
import { errorHandler } from "./components/errors";

/** @type {Function[]} */
const PostRenderFunctions = [];
/** @param {Function} f */
export function callAfterRender(f) {
  PostRenderFunctions.push(f);
}
export function postRender() {
  while (PostRenderFunctions.length > 0) {
    const PRF = PostRenderFunctions.pop();
    if (PRF) PRF();
  }
}

const safe = true;

/** @param {string} id
 * @param {TreeBase} component
 */
export function safeRender(id, component) {
  const where = document.getElementById(id);
  if (!where) {
    console.error({ id, where });
    return;
  }
  let r;
  if (safe) {
    try {
      let what = component.safeTemplate();
      if (Array.isArray(what)) what = html`${what}`;
      r = render(where, what);
    } catch (error) {
      if (error instanceof Error) {
        errorHandler(error, ` rendering ${component.className} ${id}`);
      } else {
        console.error("crash", error);
      }
      return;
    }
  } else {
    let what = component.safeTemplate();
    if (Array.isArray(what)) what = html`${what}`;
    r = render(where, what);
  }
  return r;
}
