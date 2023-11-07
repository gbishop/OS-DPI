import { html } from "uhtml";
import { TreeBase } from "./treebase";
import * as Props from "./props";
import { styleString } from "./style";
import "css/vsd.css";
import Globals from "app/globals";
import { GridFilter } from "./gridFilter";
import { imageOrVideo } from "./grid";

/** Allow await'ing for a short time
 * @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait for a condition to be satisfied
 * @param {() => boolean} test
 * @param {number} delay */
async function waitFor(test, delay = 100) {
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

  allowedChildren = ["GridFilter"];

  /** @type {HTMLDivElement} */
  markers;

  template() {
    const { data, state, actions } = Globals;
    const editing = state.get("editing");
    const items = /** @type {VRow[]} */ (
      data.getMatchingRows(GridFilter.toContentFilters(this.children), state)
    );
    const src = items.find((item) => item.image)?.image || "";
    let dragging = 0;
    const coords = [
      [0, 0], // start x and y
      [0, 0], // end x and y
    ];
    let clip = "";

    return this.component(
      { classes: ["show"] },
      html`<div>
        ${imageOrVideo(src, "", () => this.sizeMarkers(this.markers))}
        <div
          class="markers"
          ref=${(/** @type {HTMLDivElement & { observer: any }} */ node) => {
            this.sizeMarkers(node);
          }}
          onpointermove=${editing &&
          ((/** @type {PointerEvent} */ event) => {
            const rect = this.markers.getBoundingClientRect();
            const div = document.querySelector("span.coords");
            if (!div) return;
            coords[dragging][0] = Math.round(
              (100 * (event.pageX - rect.left)) / rect.width,
            );
            coords[dragging][1] = Math.round(
              (100 * (event.pageY - rect.top)) / rect.height,
            );
            clip = `${coords[0][0]}\t${coords[0][1]}`;
            if (dragging) {
              clip =
                clip +
                `\t${coords[1][0] - coords[0][0]}\t${
                  coords[1][1] - coords[0][1]
                }`;
            }
            div.innerHTML = clip;
          })}
          onpointerdown=${editing &&
          (() => {
            dragging = 1;
          })}
          onpointerup=${editing &&
          (() => {
            dragging = 0;
            navigator.clipboard.writeText(clip);
          })}
        >
          ${items
            .filter((item) => item.w)
            .map(
              (item) =>
                html`<button
                  style=${styleString({
                    left: pct(item.x),
                    top: pct(item.y),
                    width: pct(item.w),
                    height: pct(item.h),
                    position: "absolute",
                  })}
                  ?invisible=${item.invisible}
                  .dataset=${{
                    ComponentName: this.name.value,
                    ComponentType: this.constructor.name,
                    ...item,
                  }}
                  onClick=${actions.handler(this.name.value, item, "press")}
                >
                  <span>${item.label || ""}</span>
                </button>`,
            )}
          <span class="coords" style="background-color: white"></span>
        </div>
      </div>`,
    );
  }

  /** @param {HTMLDivElement} node */
  async sizeMarkers(node) {
    this.markers = node;
    const img = /** @type {HTMLImageElement} */ (node.previousElementSibling);
    const rect = await getActualImageSize(img);
    node.style.position = "absolute";
    node.style.left = px(rect.left);
    node.style.top = px(rect.top);
    node.style.width = px(rect.width);
    node.style.height = px(rect.height);
  }

  settingsDetails() {
    const props = this.propsAsProps;
    const inputs = Object.values(props).map((prop) => prop.input());
    const filters = GridFilter.FilterSettings(this.children);
    return html`<div>${filters}${inputs}</div>`;
  }

  settingsChildren() {
    return this.empty;
  }
}
TreeBase.register(VSD, "VSD");
