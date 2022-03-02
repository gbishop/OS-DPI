import { fromEvent, merge, Observable } from "rxjs";

const events = ["pointerover", "pointerout", "pointerdown", "pointerup"];
/** @type {Object.<string, Observable<Event>>} */
const streams = {};
for (const event of events) {
  streams[event] = fromEvent(document, event);
}
streams.pointerdown.subscribe(
  (x) =>
    x.target instanceof Element &&
    x.target.hasPointerCapture(x.pointerId) &&
    x.target.releasePointerCapture(x.pointerId)
);
// streams.contextmenu.subscribe((x) => x.preventDefault());
const pointer = merge(...Object.values(streams));
pointer.subscribe((x) => {
  console.log(x.type, x.target instanceof HTMLElement && x.target.innerText);
});
