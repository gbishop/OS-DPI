import { fromEvent, merge } from "rxjs";

const events = [
  "pointerover",
  "pointerout",
  "pointerout",
  "pointerdown",
  "pointerup",
  "pointermove",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "contextmenu",
];
const streams = {};
for (const event of events) {
  streams[event] = fromEvent(document, event);
}
// streams.pointerdown.subscribe((x) => x.preventDefault());
streams.contextmenu.subscribe((x) => x.preventDefault());
const pointer = merge(...Object.values(streams));
pointer.subscribe((x) =>
  console.log(x.type, x.target.innerText, x.target.disabled)
);
