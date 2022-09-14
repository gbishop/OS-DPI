import { TreeBase } from "../../treebase.js";
import { Handler, HandlerCondition } from "./handler.js";
import { HandlerResponse } from "./responses.js";
import { Select, Float } from "../../props.js";
import { html } from "uhtml";
import { EventWrap } from "../index.js";
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
  skipWhile,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import { HandlerKeyCondition } from "./handler.js";

const keySignals = new Map([
  ["keyup", "Key up"],
  ["keydown", "Key down"],
]);

export class KeyHandler extends Handler {
  Signal = new Select(keySignals);
  Debounce = new Float(0.1);

  template() {
    const { conditions, responses, keys } = this;
    const { Signal, Debounce } = this;
    return html`
      <fieldset class="Handler">
        <legend>Key Handler</legend>
        ${Signal.input()} ${Debounce.input()}
        ${this.deleteButton({ title: "Delete this handler" })}
        <fieldset class="Keys">
          <legend>
            Keys
            ${this.addChildButton("+", HandlerKeyCondition, {
              title: "Add a key",
            })}
          </legend>
          ${this.unorderedChildren(keys)}
        </fieldset>
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
    // construct debounced key event stream
    const debounceInterval = this.Debounce.valueAsNumber * 1000;
    const keyDown$ = /** @type Observable<KeyboardEvent> */ (
      fromEvent(document, "keydown")
    );

    const keyUp$ = /** @type Observable<KeyboardEvent> */ (
      fromEvent(document, "keyup")
    );

    // don't capture key events originating in the designer
    function notDesigner({ target }) {
      const designer = document.getElementById("designer");
      return !designer || !designer.contains(target);
    }

    // build the debounced key event stream
    const keyEvents$ = /** @type Observable<KeyboardEvent> */ (
      // start with the key down stream
      keyDown$.pipe(
        // merge with the key up stream
        mergeWith(keyUp$),
        // remove any repeats
        filter((e) => !e.repeat && notDesigner(e)),
        // group by the key
        groupBy((e) => e.key),
        // process each group and merge the results
        mergeMap((group$) =>
          group$.pipe(
            // debounce flurries of events
            debounceTime(debounceInterval),
            // wait for a key down
            skipWhile((e) => e.type != "keydown"),
            // only output when the type changes
            distinctUntilKeyChanged("type")
          )
        )
      )
    );
    let stream$;
    const keys = this.keys.map((key) => key.Key.value);
    stream$ = keyEvents$.pipe(
      filter(
        (e) =>
          e.type == this.Signal.value &&
          (keys.length == 0 || keys.indexOf(e.key) >= 0)
      ),
      map((e) => {
        // add context info to event for use in the conditions and response
        const kw = EventWrap(e);
        kw.access = {
          key: e.key,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          eventType: e.type,
        };
        return kw;
      })
    );
    for (const condition of this.conditions) {
      stream$ = stream$.pipe(filter((e) => condition.Condition.eval(e.access)));
    }
    stream$.pipe(takeUntil(stop$)).subscribe((e) => this.respond(e));
  }
}
TreeBase.register(KeyHandler);
