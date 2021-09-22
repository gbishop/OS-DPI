import { html, render } from "uhtml";
import { state } from "../state";
import { getTaggedRows } from "../data";
import * as rules from "../rules";
import ABase from "./a-base";

/**
 * Debounce a function call so that it happens no more often than wait ms
 *
 * @param {() => void} callback - function to call
 * @param {number} wait - ms to wait
 * @return {() => void} returns a debounced version of the function
 */
function debounce(callback, wait) {
  let timeout = 0;
  return () => {
    timeout && clearTimeout(timeout);
    timeout = window.setTimeout(callback, wait);
  };
}

class AVSD extends ABase {
  tags = "";
  match = "contains";
  name = "a-vsd";
  scale = 1;

  static observed = "tags match name scale";

  init() {
    state.observe(
      this,
      ...this.tags.split(" ").filter((tag) => tag.startsWith("$"))
    );
    this.timer = null;
    const onMove = () => {
      this.classList.add("show");
      if (this.timer) clearTimeout(this.timer);
      this.timer = window.setTimeout(() => {
        this.timer = null;
        this.classList.remove("show");
      }, 2 * 1000);
    };
    this.classList.add("show");
    this.addEventListener("mousemove", debounce(onMove, 200));
    this.addEventListener("touchmove", debounce(onMove, 200));
  }
  /** getActualImageShape - attempt to determine the actual image area from
   * rendered image, essentially undoing the object-fit: contain.
   * returns {Object}
   */
  getActualImageShape() {
    const img = this.img.current;
    let left = 0,
      top = 0,
      width = 1,
      height = 1;
    if (img) {
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
  /** markers - render the overlay buttons on the image */
  markers() {
    const { left, top, width, height } = this.getActualImageShape();
    // console.log("markers", left, top, width, height);
    const buttons = this.items
      .filter((item) => item.msg)
      .map(
        (item) => html`<button
          style=${[
            `left: ${left + (width * item.details.x) / 100}px`,
            `top: ${top + (height * item.details.y) / 100}px`,
            `width: ${(width * item.details.w) / 100}px`,
            `height: ${(height * item.details.h) / 100}px`,
          ].join(";")}
          onClick=${rules.handler(this.name, item, "press")}
        >
          <span>${item.label || item.msg}</span>
        </button>`
      );
    render(this.markerDiv.current, html`${buttons}`);
  }
  render() {
    // console.log("render", this);
    this.style.flexGrow = this.scale.toString();
    this.items = getTaggedRows(this.tags, this.match);
    /** reference to the image
     * @type { {current: HTMLElement} } */
    this.img = { current: null };
    /** reference to the div containing the markers
     * @type { {current: HTMLElement} } */
    this.markerDiv = { current: null };
    // console.log("render", this.items);
    const src = this.items.find((item) => item.details.src).details.src;
    render(
      this,
      html`
        <div>
          <img src=${src} onload=${() => this.markers()} ref=${this.img} />
          <div class="markers" ref=${this.markerDiv}></div>
        </div>
      `
    );
    if (!this.resizeObserver) {
      /* watch for changes in the image size so we can adjust the markers */
      this.resizeObserver = new ResizeObserver(() => this.markers());
      this.resizeObserver.observe(this.img.current);
    }
  }
}
customElements.define("a-vsd", AVSD);
