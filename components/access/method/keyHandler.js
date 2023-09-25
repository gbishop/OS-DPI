import { TreeBase } from "components/treebase";
import * as Props from "components/props";
import { html } from "uhtml";
import { Handler, HandlerKeyCondition } from "./index";
import * as RxJs from "rxjs";

const keySignals = new Map([
  ["keyup", "Key up"],
  ["keydown", "Key down"],
]);

export class KeyHandler extends Handler {
  allowedChildren = [
    "HandlerKeyCondition",
    "HandlerCondition",
    "HandlerResponse",
  ];

  Signal = new Props.Select(keySignals);

  settings() {
    const { conditions, responses, keys } = this;
    const { Signal } = this;
    return html`
      <fieldset class="Handler" tabindex="0" id=${this.id}>
        <legend>Key Handler</legend>
        ${Signal.input()}
        <fieldset class="Keys">
          <legend>Keys</legend>
          ${this.unorderedChildren(keys)}
        </fieldset>
        <fieldset class="Conditions">
          <legend>Conditions</legend>
          ${this.unorderedChildren(
            conditions.filter((c) => !(c instanceof HandlerKeyCondition)),
          )}
        </fieldset>
        <fieldset class="Responses">
          <legend>Responses</legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {RxJs.Subject} _stop$ */
  configure(_stop$) {
    const method = this.method;
    const streamName = "key";

    // only create it once
    if (method.streams[streamName]) return;

    // construct debounced key event stream
    const debounceInterval = method.KeyDebounce.valueAsNumber * 1000;
    const keyDown$ = /** @type RxJs.Observable<KeyboardEvent> */ (
      RxJs.fromEvent(document, "keydown")
    );

    const keyUp$ = /** @type RxJs.Observable<KeyboardEvent> */ (
      RxJs.fromEvent(document, "keyup")
    );

    // don't capture key events originating in the designer
    function notDesigner({ target }) {
      const designer = document.getElementById("designer");
      return !designer || !designer.contains(target);
    }

    // build the debounced key event stream
    const keyEvents$ = /** @type RxJs.Observable<KeyboardEvent> */ (
      // start with the key down stream
      keyDown$.pipe(
        // merge with the key up stream
        RxJs.mergeWith(keyUp$),
        // ignore events from the designer
        RxJs.filter((e) => notDesigner(e)),
        // prevent default actions
        RxJs.tap((e) => e.preventDefault()),
        // remove any repeats
        RxJs.filter((e) => !e.repeat),
        // group by the key
        RxJs.groupBy((e) => e.key),
        // process each group and merge the results
        RxJs.mergeMap((group$) =>
          group$.pipe(
            // debounce flurries of events
            RxJs.debounceTime(debounceInterval),
            // wait for a key down
            RxJs.skipWhile((e) => e.type != "keydown"),
            // only output when the type changes
            RxJs.distinctUntilKeyChanged("type"),
          ),
        ),
        RxJs.map((e) => {
          // add context info to event for use in the conditions and response
          /** @type {EventLike} */
          let kw = {
            type: e.type,
            target: null,
            timeStamp: e.timeStamp,
            access: {
              key: e.key,
              altKey: e.altKey,
              ctrlKey: e.ctrlKey,
              metaKey: e.metaKey,
              shiftKey: e.shiftKey,
              eventType: e.type,
              ...method.pattern.getCurrentAccess(),
            },
          };
          return kw;
        }),
      )
    );
    method.streams[streamName] = keyEvents$;
  }

  /**
   * Test the conditions for this handler
   * @param {EventLike} event
   * @returns {boolean}
   */
  test(event) {
    const signal = this.Signal.value;

    // key conditions are OR'ed together
    // Other conditions are AND'ed
    const keys = this.keys;
    const conditions = this.conditions.filter(
      (condition) => !(condition instanceof HandlerKeyCondition),
    );
    return (
      event.type == signal &&
      (keys.length == 0 || keys.some((key) => key.eval(event.access))) &&
      conditions.every((condition) => condition.eval(event.access))
    );
  }
}
TreeBase.register(KeyHandler, "KeyHandler");
