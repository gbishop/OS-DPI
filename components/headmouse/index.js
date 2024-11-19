import { TreeBase } from "components/treebase";
import * as Props from "components/props";
import { TrackyMouse } from "./tracky-mouse/tracky-mouse";
import "css/tracky-mouse.css";
import Globals from "app/globals";
import { html } from "uhtml";

class HeadMouse extends TreeBase {
  stateName = new Props.String("$HeadMouse");

  /** @type {Promise} */
  promise;

  template() {
    const stateName = this.stateName.value;
    const { state } = Globals;
    const updated = state.hasBeenUpdated(stateName);
    this.promise.then(() => {
      if (updated) {
        const status = state.get(stateName, "off");
        if (status == "on" || status == "setup") {
          document.body.classList.toggle("HeadMouse", true);
          TrackyMouse.useCamera();
          TrackyMouse.showUI(status == "setup");
        } else if (status == "off") {
          document.body.classList.toggle("HeadMouse", false);
          TrackyMouse.pauseCamera();
          TrackyMouse.showUI(false);
        }
      }
    });
    return html`<div />`;
  }

  init() {
    super.init();
    TrackyMouse.dependenciesRoot = "./tracky-mouse";
    this.promise = TrackyMouse.loadDependencies();
    this.promise.then(() => {
      TrackyMouse.init();
      // TrackyMouse.useCamera();

      // Pointer event simulation logic should be built into tracky-mouse in the future.
      const getEventOptions = ({ x, y }) => {
        return {
          view: window, // needed so the browser can calculate offsetX/Y from the clientX/Y
          clientX: x,
          clientY: y,
          pointerId: 1234567890, // a special value so other code can detect these simulated events
          pointerType: "mouse",
          isPrimary: true,
        };
      };
      let last_el_over;
      /** @param {number} x
       * @param {number} y
       */
      TrackyMouse.onPointerMove = (x, y) => {
        const target = document.elementFromPoint(x, y) || document.body;
        if (target !== last_el_over) {
          if (last_el_over) {
            const event = new PointerEvent(
              "pointerout",
              Object.assign(getEventOptions({ x, y }), {
                button: 0,
                buttons: 1,
                bubbles: true,
                cancelable: false,
              }),
            );
            last_el_over.dispatchEvent(event);
          }
          const event = new PointerEvent(
            "pointerover",
            Object.assign(getEventOptions({ x, y }), {
              button: 0,
              buttons: 1,
              bubbles: true,
              cancelable: false,
            }),
          );
          target.dispatchEvent(event);
          last_el_over = target;
        }
        const event = new PointerEvent(
          "pointermove",
          Object.assign(getEventOptions({ x, y }), {
            button: 0,
            buttons: 1,
            bubbles: true,
            cancelable: true,
          }),
        );
        target.dispatchEvent(event);
      };
    });
  }
}
TreeBase.register(HeadMouse, "HeadMouse");
