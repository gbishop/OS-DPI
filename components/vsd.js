import { html, render } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";

/**
 * Calculate the actual image size undoing the effects of object-fit
 *
 * @param {HTMLImageElement} img
 * */
function getActualImageSize(img) {
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

class VSD extends Base {
  /** @type {Props} */
  static defaultProps = {
    tags: [],
    match: "contains",
    name: "vsd",
    scale: "1",
  };

  template() {
    const { data, state, rules } = this.context;
    const tags = state.normalizeTags(this.props.tags);
    const items = data.getTaggedRows(tags, this.props.match);
    const src = items.find((item) => item.details.src).details.src;
    return html`<div class="vsd flex show">
      <img src=${src} />
    </div>`;
  }
}
componentMap.addMap("vsd", VSD);
