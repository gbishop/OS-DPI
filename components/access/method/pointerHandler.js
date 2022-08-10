import { TreeBase } from "../../treebase";
import { Handler, HandlerCondition } from "./handler";
import { HandlerResponse } from "./responses";
import { Select, Float } from "../../props";
import { html } from "uhtml";
import { EventWrap, ButtonWrap } from "../index";
import {
  debounceTime,
  distinctUntilKeyChanged,
  filter,
  fromEvent,
  groupBy,
  map,
  mergeMap,
  mergeWith,
  Observable,
  Subject,
  takeUntil,
  tap,
} from "rxjs";

const pointerSignals = new Map([
  ["pointerdown", "Pointer down"],
  ["pointermove", "Pointer move"],
  ["pointerup", "Pointer up"],
  ["pointerover", "Pointer enter"],
  ["pointerout", "Pointer leave"],
]);

export class PointerHandler extends Handler {
  Signal = new Select(pointerSignals);
  Debounce = new Float(0.1);

  template() {
    const { conditions, responses, Signal, Debounce } = this;
    return html`
      <fieldset class="Handler">
        <legend>Pointer Handler</legend>
        ${Signal.input()} ${Debounce.input()}
        ${this.deleteButton({ title: "Delete this handler" })}
        <fieldset class="Conditions">
          <legend>
            Conditions
            ${this.addChildButton("+", HandlerCondition, {
              title: "Add a condition",
            })}
          </legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>
            Responses
            ${this.addChildButton("+", HandlerResponse, {
              title: "Add a response",
            })}
          </legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {Subject} stop$ */
  configure(stop$) {
    const debounceInterval = this.Debounce.valueAsNumber * 1000;
    // construct pointer streams
    /**
     * Get the types correct
     *
     * @param {Node} where
     * @param {string} event
     * @returns {Observable<PointerEvent>}
     */
    function fromPointerEvent(where, event) {
      return /** @type {Observable<PointerEvent>} */ (fromEvent(where, event));
    }
    const pointerDown$ = fromPointerEvent(document, "pointerdown");

    // disable pointer capture
    pointerDown$.pipe(takeUntil(stop$)).subscribe(
      /** @param {PointerEvent} x */
      (x) =>
        x.target instanceof Element &&
        x.target.hasPointerCapture(x.pointerId) &&
        x.target.releasePointerCapture(x.pointerId)
    );
    const pointerUp$ = fromPointerEvent(document, "pointerup");

    // const pointerMove$ = fromPointerEvent(document, "pointermove");

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
     * @param {Observable<PointerEvent>} in$
     * @param {Observable<PointerEvent>} out$
     * @param {Number} interval
     */
    function debouncedPointer(in$, out$, interval) {
      return in$.pipe(
        mergeWith(out$),
        filter(
          (e) =>
            e.target instanceof HTMLButtonElement &&
            !e.target.disabled &&
            e.target.closest("div#UI") !== null
        ),
        groupBy((e) => e.target),
        mergeMap(($group) =>
          $group.pipe(debounceTime(interval), distinctUntilKeyChanged("type"))
        )
      );
    }
    const pointerOverOut$ = debouncedPointer(
      pointerOver$,
      pointerOut$,
      debounceInterval
    );
    // const pointerDownUp$ = debouncedPointer(
    //   pointerDown$,
    //   pointerUp$,
    //   debounceInterval
    // );

    // disable the context menu event for touch devices
    fromEvent(document, "contextmenu")
      .pipe(
        filter(
          (e) =>
            e.target instanceof HTMLButtonElement &&
            e.target.closest("div#UI") !== null
        ),
        takeUntil(stop$)
      )
      .subscribe((e) => e.preventDefault());

    let stream$ = pointerOverOut$.pipe(
      filter((e) => e.type == this.Signal.value),
      map((e) => {
        const ew = EventWrap(e);
        ew.access = ButtonWrap(e.target).access;
        ew.access.eventType = e.type;
        return ew;
      })
    );
    for (const condition of this.conditions) {
      stream$ = stream$.pipe(filter((e) => condition.Condition.eval(e.access)));
    }
    stream$.pipe(takeUntil(stop$)).subscribe((e) => this.respond(e));
  }
}
TreeBase.register(PointerHandler);
