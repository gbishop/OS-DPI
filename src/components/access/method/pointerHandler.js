/**
 * Handle pointer events integrated with Pattern.Groups
 *
 * TODO: we should be "over" the current button after activate. We are
 * currently not until you leave the current button and return.
 */

import { TreeBase } from "components/treebase";
import { Handler } from "./index";
import * as Props from "components/props";
import { html } from "uhtml";
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
  SkipOnRedraw = new Props.Boolean(false);

  settings() {
    const { conditions, responses, Signal } = this;
    const skip =
      this.Signal.value == "pointerover"
        ? this.SkipOnRedraw.input()
        : this.empty;
    return html`
      <fieldset class="Handler" tabindex="0" id="${this.id}">
        <legend>Pointer Handler</legend>
        ${Signal.input()} ${skip}
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

  /** @param {RxJs.Subject} _ */
  configure(_) {
    const method = this.method;
    const streamName = "pointer";
    // only create it once
    if (method.streams[streamName]) return;

    const pattern = method.pattern;

    const inOutThreshold = method.PointerEnterDebounce.valueAsNumber * 1000;
    const upDownThreshold = method.PointerDownDebounce.valueAsNumber * 1000;

    /**
     * Get the types correct
     *
     * @param {string} event
     * @returns {RxJs.Observable<PointerEvent>}
     */
    function fromPointerEvent(event) {
      return /** @type {RxJs.Observable<PointerEvent>} */ (
        RxJs.fromEvent(document, event)
      );
    }

    const pointerDown$ = fromPointerEvent("pointerdown").pipe(
      // disable pointer capture
      RxJs.tap(
        (x) =>
          x.target instanceof Element &&
          x.target.hasPointerCapture(x.pointerId) &&
          x.target.releasePointerCapture(x.pointerId),
      ),
      RxJs.throttleTime(upDownThreshold),
    );

    const pointerUp$ = fromPointerEvent("pointerup").pipe(
      RxJs.throttleTime(upDownThreshold),
    );

    /** @type {EventLike} */
    const None = { type: "none", target: null, timeStamp: 0 };

    /** This function defines the State Machine that will be applied to the stream
     * of events by the RxJs.scan operator. It takes this function and an initial state
     * and produces a stream of states. On each cycle after the first the input state
     * will be the output state from the previous cycle.
     *
     * Define the state for the machine
     *
     * @typedef {Object} machineState
     * @property {EventLike} current - the currently active target
     * @property {EventLike} over - the element we're currently over
     * @property {number} timeStamp - the time of the last event
     * @property {Map<Target | null, number>} accumulators - total time spent over each element
     * @property {EventLike[]} emittedEvents - events to pass along
     *
     * @param {machineState} state
     * @param {EventLike} event - the incoming pointer event
     * @returns {machineState}
     */
    function stateMachine(
      { current, over, timeStamp, accumulators, emittedEvents },
      event,
    ) {
      // whenever we emit an event the pattern might get changed in the response
      // check here to see if the target is still the same
      if (emittedEvents.length > 0 && over !== None) {
        const newOver = pattern.remapEventTarget({
          ...over,
          target: over.originalTarget,
        });
        if (newOver.target !== over.target) {
          // copy the accumulator to the new target
          accumulators.set(newOver.target, accumulators.get(over.target) || 0);
          // zero the old target
          accumulators.set(over.target, 0);
          // use this new target
          over = newOver;
        }
      }

      // time since last event
      const dt = event.timeStamp - timeStamp;
      timeStamp = event.timeStamp;
      // clear the emitted Events
      emittedEvents = [];
      // increment the time of the target we are over
      let sum = accumulators.get(over.target) || 0;
      sum += dt;
      accumulators.set(over.target, sum);
      const threshold = inOutThreshold;
      // exceeding the threshold triggers production of events
      if (sum > threshold) {
        // clamp it at the threshold value
        accumulators.set(over.target, threshold);
        if (over.target != current.target) {
          if (current !== None) {
            emittedEvents.push({ ...current, type: "pointerout" });
          }
          current = over;
          if (current !== None) {
            emittedEvents.push({ ...current, type: "pointerover" });
            // console.log("push pointerover", events);
          }
        } else {
          current = over;
        }
      }
      // decrement the other accumulators
      for (let [target, value] of accumulators) {
        if (target !== over.target) {
          value -= dt;
          if (value <= 0) {
            // this should prevent keeping old ones alive
            accumulators.delete(target);
          } else {
            accumulators.set(target, value);
          }
        }
      }
      if (event.type == "pointerover") {
        over = pattern.remapEventTarget(event);
      } else if (event.type == "pointerout") {
        over = None;
      } else if (event.type == "pointerdown" && current !== None) {
        emittedEvents.push({ ...current, type: "pointerdown" });
      } else if (event.type == "pointerup" && current !== None) {
        emittedEvents.push({ ...current, type: "pointerup" });
      }
      return {
        current,
        over,
        timeStamp,
        accumulators,
        emittedEvents,
      };
    }

    const pointerStream$ = pointerDown$.pipe(
      // merge the streams
      RxJs.mergeWith(
        pointerUp$,
        fromPointerEvent("pointerover"),
        fromPointerEvent("pointerout"),
        fromPointerEvent("contextmenu"),
      ),
      // keep only events related to buttons within the UI
      RxJs.filter(
        (e) =>
          e.target instanceof HTMLButtonElement &&
          e.target.closest("div#UI") !== null &&
          !e.target.disabled,
      ),
      // kill contextmenu events
      RxJs.tap((e) => e.type === "contextmenu" && e.preventDefault()),

      // Add the timer events
      RxJs.mergeWith(
        // I pulled 10ms out of my ear, would 20 or even 50 do?
        RxJs.timer(10, 10).pipe(RxJs.map(() => new PointerEvent("tick"))),
      ),
      // run the state machine
      RxJs.scan(stateMachine, {
        // the initial state
        current: None,
        over: None,
        timeStamp: 0,
        accumulators: new Map(),
        emittedEvents: [],
      }),
      RxJs.filter((s) => s.emittedEvents.length > 0),
      RxJs.mergeMap((state) =>
        RxJs.of(
          ...state.emittedEvents.map((event) => {
            /** @type {EventLike} */
            let w = {
              ...event,
              timeStamp: state.timeStamp,
              access: event.access,
            };
            w.access.eventType = event.type;
            return w;
          }),
        ),
      ),
      // multicast the stream
      RxJs.share(),
    );

    method.streams[streamName] = pointerStream$;
  }
}
TreeBase.register(PointerHandler, "PointerHandler");
