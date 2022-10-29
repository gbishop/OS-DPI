import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "../css/vsd.css";
import "./img-db";
import Globals from "../globals";
import { GridFilter } from "./grid";

/** Allow await'ing for a short time
 * @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait for a condition to be satisfied
 * @param {() => boolean} test
 * @param {number} delay */
async function waitFor(test, delay = 1) {
  while (!test()) await sleep(delay);
}

/**
 * Calculate the actual image size undoing the effects of object-fit
 * This is async so it can wait for the image to be loaded initially.
 *
 * @param {HTMLImageElement} img
 * */
async function getActualImageSize(img) {
  let left = 0,
    top = 0,
    width = 1,
    height = 1;
  if (img) {
    // wait for the image to load
    await waitFor(() => img.complete && img.naturalWidth != 0);
    const cw = img.width,
      ch = img.height,
      iw = img.naturalWidth,
      ih = img.naturalHeight,
      iratio = iw / ih,
      cratio = cw / ch;
    if (iratio > cratio) {
      width = cw;
      height = cw / iratio;
    } else {
      width = ch * iratio;
      height = ch;
    }
    left = (cw - width) / 2;
    top = (ch - height) / 2;
  }
  return { left, top, width, height };
}

/** @param {number} v */
function px(v) {
  return `${v}px`;
}
/** @param {number} v */
function pct(v) {
  return `${v}%`;
}

/** @typedef {Object} vsdData
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {string} image
 * @property {boolean} invisible
 */
/** @typedef {Row & vsdData} VRow */
class VSD extends TreeBase {
  name = new Props.String("vsd");
  scale = new Props.Float(1);

  /** @type {GridFilter[]} */
  children = [];

  get filters() {
    return this.children.map((child) => ({
      field: child.field.value,
      operator: child.operator.value,
      value: child.value.value,
    }));
  }

  uiTemplate() {
    const { data, state, rules } = Globals;
    const items = /** @type {VRow[]} */ (
      data.getMatchingRows(this.filters, state)
    );
    const src = items.find((item) => item.image)?.image;
    return html`<div class="vsd flex show" id=${this.id}>
      <img is="img-db" dbsrc=${src} />
      <div
        class="markers"
        ref=${(/** @type {HTMLDivElement & { observer: any }} */ node) => {
          const img = /** @type {HTMLImageElement} */ (
            node.previousElementSibling
          );
          if (!node.observer) {
            /* get a callback when the image changes size so that we
             * can resize the div containing the markers to match */
            node.observer = new ResizeObserver(async () => {
              const rect = await getActualImageSize(img);
              node.style.position = "absolute";
              node.style.left = px(rect.left);
              node.style.top = px(rect.top);
              node.style.width = px(rect.width);
              node.style.height = px(rect.height);
            });
            node.observer.observe(img);
          }
        }}
      >
        ${items
          .filter((item) => item.w)
          .map(
            (item) => html`<button
              style=${styleString({
                left: pct(item.x),
                top: pct(item.y),
                width: pct(item.w),
                height: pct(item.h),
                position: "absolute",
              })}
              ?invisible=${item.invisible}
              onClick=${rules.handler(this.name, item, "press")}
            >
              <span>${item.label || ""}</span>
            </button>`
          )}
      </div>
    </div>`;
  }
}
TreeBase.register(VSD, "VSD");
