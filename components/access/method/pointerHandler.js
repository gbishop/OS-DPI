import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
import { EventWrap, ButtonWrap } from "../index";
import * as RxJs from "rxjs";

const pointerSignals = new Map([
  ["pointerdown", "Pointer down"],
  ["pointerup", "Pointer up"],
  ["pointerover", "Pointer enter"],
  ["pointerout", "Pointer leave"],
]);

export class PointerHandler extends Handler {
  allowedChildren = ["HandlerCondition", "HandlerResponse"];
  
  Signal = new Props.Select(pointerSignals);
  Debounce = new Props.Float(0.1);
  SkipOnRedraw = new Props.Boolean(false);

  settings() {
    const { conditions, responses, Signal, Debounce } = this;
    const skip =
      this.Signal.value == "pointerover"
        ? this.SkipOnRedraw.input()
        : html`<!--empty-->`;
    return html`
      <fieldset class="Handler">
        <legend>Pointer Handler</legend>
        ${Signal.input()} ${Debounce.input()} ${skip}
        <fieldset class="Conditions">
          <legend>Conditions</legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>Responses</legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {RxJs.Subject} stop$ */
  configure(stop$) {
    const signal = this.Signal.value;

    const debounceInterval = this.Debounce.valueAsNumber * 1000;
    // construct pointer streams
    /**
     * Get the types correct
     *
     * @param {Node} where
     * @param {string} event
     * @returns {RxJs.Observable<PointerEvent>}
     */
    function fromPointerEvent(where, event) {
      return /** @type {RxJs.Observable<PointerEvent>} */ (
        RxJs.fromEvent(where, event)
      );
    }
    const pointerDown$ = fromPointerEvent(document, "pointerdown");

    // disable pointer capture
    pointerDown$.pipe(RxJs.takeUntil(stop$)).subscribe(
      /** @param {PointerEvent} x */
      (x) =>
        x.target instanceof Element &&
        x.target.hasPointerCapture(x.pointerId) &&
        x.target.releasePointerCapture(x.pointerId)
    );
    const pointerUp$ = fromPointerEvent(document, "pointerup");

    const pointerOver$ = fromPointerEvent(document, "pointerover");
    const pointerOut$ = fromPointerEvent(document, "pointerout");

    /**
     * Create a debounced pointer stream
     *
     * We use groupBy to create a stream for each target and then debounce the
     * streams independently before merging them back together. The final
     * distinctUntilKeyChanged prevents producing multiple events when the
     * pointer leaves and re-enters in a short time.
     *
     * @param {RxJs.Observable<PointerEvent>} in$
     * @param {RxJs.Observable<PointerEvent>} out$
     * @param {Number} interval
     */
    function debouncedPointer(in$, out$, interval) {
      return in$.pipe(
        RxJs.mergeWith(out$),
        RxJs.filter(
          (e) =>
            e.target instanceof HTMLButtonElement &&
            e.target.closest("div#UI") !== null
        ),
        RxJs.groupBy((e) => e.target),
        RxJs.mergeMap(($group) =>
          $group.pipe(
            RxJs.debounceTime(interval),
            RxJs.distinctUntilKeyChanged("type")
          )
        )
      );
    }
    const pointerOverOut$ = debouncedPointer(
      pointerOver$,
      pointerOut$,
      debounceInterval
    );
    const pointerDownUp$ = debouncedPointer(
      pointerDown$,
      pointerUp$,
      debounceInterval
    );

    // disable the context menu event for touch devices
    RxJs.fromEvent(document, "contextmenu")
      .pipe(
        RxJs.filter(
          (e) =>
            e.target instanceof HTMLButtonElement &&
            e.target.closest("div#UI") !== null
        ),
        RxJs.takeUntil(stop$)
      )
      .subscribe((e) => e.preventDefault());

    /** @type {RxJs.Observable<Event & { access: {} }>} */
    let stream$ = null;
    stream$ = pointerOverOut$.pipe(
      RxJs.mergeWith(pointerDownUp$),
      RxJs.filter(
        (e) => e.target instanceof HTMLButtonElement && !e.target.disabled
      ),
      RxJs.map((e) => {
        const ew = EventWrap(e);
        ew.access = { ...ButtonWrap(e.target).access };
        ew.access.eventType = e.type;
        return ew;
      })
    );
    /* I am killing the "pointerover" event that occurs when a button is replaced
     * on a redraw if the user requests it. This avoids repeats when dwelling
     * over a button causes a new "page" to be created.
     *
     * TODO: I bet there is a cleaner way to do this.
     */
    const firstEvent = ButtonWrap(new PointerEvent("first"));
    if (signal == "pointerover" && this.SkipOnRedraw.value) {
      stream$ = stream$.pipe(
        // a fake event to startup pairwise
        RxJs.startWith(firstEvent),
        // pair the events so I can compare them
        RxJs.pairwise(),
        // if we get a pair of pointerover events with different targets the page must have redrawn.
        RxJs.filter(
          ([first, second]) =>
            !(
              first.type == "pointerover" &&
              second.type == "pointerover" &&
              first.target !== second.target
            )
        ),
        // undo the pairwise
        RxJs.map(([_first, second]) => second)
      );
    }
    // only get the signal we want
    stream$ = stream$.pipe(RxJs.filter((e) => e.type == signal));
    // apply the conditions
    for (const condition of this.conditions) {
      stream$ = stream$.pipe(
        RxJs.filter((e) => condition.Condition.eval(e.access))
      );
    }
    stream$
      .pipe(
        // tap((event) => console.log("ph", event.type, event)),
        RxJs.takeUntil(stop$)
      )
      .subscribe((e) => this.respond(e));
  }
}
TreeBase.register(PointerHandler, "PointerHandler");
