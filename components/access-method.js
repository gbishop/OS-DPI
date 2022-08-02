import { html } from "uhtml";
import css from "ustyler";
import { Base } from "./base";
import { TreeBase } from "./treebase";
import {
  Select,
  Expression,
  String,
  Integer,
  Float,
  UID,
  Boolean,
} from "./props";
import Globals from "../globals";
import db from "../db";
import { extender, own } from "proxy-pants";
import {
  debounceTime,
  delayWhen,
  distinctUntilKeyChanged,
  filter,
  from,
  fromEvent,
  groupBy,
  interval,
  map,
  mergeMap,
  mergeWith,
  Observable,
  share,
  skipWhile,
  Subject,
  takeUntil,
  tap,
} from "rxjs";
import { ButtonWrap } from "./access-pattern";
import { HandlerResponse } from "./access-method-responses";

export class AccessMethod extends Base {
  template() {
    return html`<div class="access-method treebase">
      ${Globals.method.template()}
    </div>`;
  }
}

export class MethodChooser extends TreeBase {
  /** @type {Method[]} */
  children = [];

  // allow tearing down handlers when changing configurations
  stop$ = new Subject();

  update() {
    db.write("method", this.toObject());
    this.configure();
    Globals.state.update();
  }

  init() {
    this.configure();
    super.init();
  }

  configure() {
    this.stop$.next();
    for (const method of this.children) {
      method.configure(this.stop$);
    }
  }

  template() {
    return html`<div class="MethodChooser" onChange=${() => this.update()}>
      ${this.addChildButton("Add Method", Method, {
        title: "Create a new access method",
      })}
      ${this.children.map((child) => child.template())}
    </div> `;
  }
}
TreeBase.register(MethodChooser);

const EventWrapProto = {
  access: {},
};

const EventWrap = extender(EventWrapProto);

export class Method extends TreeBase {
  props = {
    Name: new String("New method"),
    Key: new UID(),
    Active: new Boolean(false),
  };

  open = false;

  /** @type {(Handler | Timer)[]} */
  children = [];

  get timers() {
    return /** @type {Timer[]} */ (
      this.children.filter((child) => child instanceof Timer)
    );
  }

  get handlers() {
    return /** @type {Handler[]} */ (
      this.children.filter((child) => child instanceof Handler)
    );
  }

  template() {
    const { Name, Active } = this.props;
    return html`<details
      class="Method"
      ?open=${this.open}
      ontoggle=${({ target }) => (this.open = target.open)}
    >
      <summary>
        ${Name.value} ${Active.value == "true" ? html`&check;` : html``}
      </summary>
      <div class="Method">
        ${Name.input()} ${Active.input()}
        ${this.deleteButton({ title: "Delete this method" })}
        <fieldset>
          <legend>
            Timers ${this.addChildButton("+", Timer, { title: "Add a timer" })}
          </legend>
          ${this.unorderedChildren(this.timers)}
        </fieldset>
        <fieldset>
          <legend>
            Handlers
            ${this.addChildButton("+", Handler, { title: "Add a handler" })}
          </legend>
          ${this.orderedChildren(this.handlers)}
        </fieldset>
      </div>
    </details>`;
  }

  /** Configure the rxjs pipelines to implement this method */
  /** @param {Subject} stop$ */
  configure(stop$) {
    if (this.props.Active.value == "true") {
      for (const child of this.children) {
        child.configure(stop$);
      }
    }
  }
}
TreeBase.register(Method);

class Timer extends TreeBase {
  props = {
    Interval: new Float(0.5, { hiddenLabel: true }),
    Name: new String("timer", { hiddenLabel: true }),
    Key: new UID(),
  };

  template() {
    return html`${this.props.Name.input()} ${this.props.Interval.input()}
    ${this.deleteButton()}`;
  }

  configure() {}
}
TreeBase.register(Timer);

const allSignals = new Map([
  ["keyup", "Key up"],
  ["keydown", "Key down"],
  ["pointerdown", "Pointer down"],
  ["pointermove", "Pointer move"],
  ["pointerup", "Pointer up"],
  ["pointerover", "Pointer enter"],
  ["pointerout", "Pointer leave"],
  ["transitionend", "Transition end"],
  ["timer", "Timer complete"],
]);

const allKeys = new Map([
  [" ", "Space"],
  ["Enter", "Enter"],
  ["ArrowLeft", "Left Arrow"],
  ["ArrowRight", "Right Arrow"],
  ["ArrowUp", "Up Arrow"],
  ["ArrowDown", "Down Arrow"],
]);

class Handler extends TreeBase {
  props = {
    Signal: new Select(allSignals),
    Debounce: new Float(0.5),
  };
  /** @type {(HandlerCondition | HandlerKey | HandlerResponse)[]} */
  children = [];

  get conditions() {
    return /** @type {HandlerCondition[]} */ (
      this.children.filter((child) => child instanceof HandlerCondition)
    );
  }

  get keys() {
    return /** @type {HandlerKey[]} */ (
      this.children.filter((child) => child instanceof HandlerKey)
    );
  }

  get responses() {
    return /** @type {HandlerResponse[]} */ (
      this.children.filter((child) => child instanceof HandlerResponse)
    );
  }

  template() {
    const { conditions, responses, keys } = this;
    const { Signal, Debounce } = this.props;
    let keyBlock = html``;
    if (Signal.value && Signal.value.startsWith("key")) {
      keyBlock = html`<fieldset class="Keys">
        <legend>
          Keys ${this.addChildButton("+", HandlerKey, { title: "Add a key" })}
        </legend>
        ${this.unorderedChildren(keys)}
      </fieldset>`;
    }
    return html`
      <fieldset class="Handler">
        <legend>Handler</legend>
        ${Signal.input()} ${Debounce.input()}
        ${this.deleteButton({ title: "Delete this handler" })} ${keyBlock}
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
    const signal = this.props.Signal.value;

    if (signal.startsWith("key")) {
      this.configureKey(signal, stop$);
    } else if (signal.startsWith("pointer")) {
      this.configurePointer(signal, stop$);
    } else if (signal.startsWith("timer")) {
      this.configureTimer(signal, stop$);
    } else {
      this.configureOther(signal, stop$);
    }
  }

  /**
   * @param {string} signal
   * @param {Subject} stop$
   */
  configureKey(signal, stop$) {
    // construct debounced key event stream
    const debounceInterval = this.props.Debounce.valueAsNumber * 1000;
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
    const keys = this.keys.map((key) => key.props.Key.value);
    stream$ = keyEvents$.pipe(
      filter(
        (e) =>
          e.type == signal && (keys.length == 0 || keys.indexOf(e.key) >= 0)
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
      stream$ = stream$.pipe(
        filter((e) => condition.props.Condition.eval(e.access))
      );
    }
    stream$.pipe(takeUntil(stop$)).subscribe((e) => this.respond(e));
  }

  /**
   * @param {string} signal
   * @param {Subject} stop$
   */
  configurePointer(signal, stop$) {
    const debounceInterval = this.props.Debounce.valueAsNumber * 1000;
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

    const pointerMove$ = fromPointerEvent(document, "pointermove");

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
    const pointerDownUp$ = debouncedPointer(
      pointerDown$,
      pointerUp$,
      debounceInterval
    );

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
      filter((e) => e.type == signal),
      map((e) => {
        const ew = EventWrap(e);
        ew.access = ButtonWrap(e.target).access;
        ew.access.eventType = e.type;
        return ew;
      })
    );
    for (const condition of this.conditions) {
      stream$ = stream$.pipe(
        filter((e) => condition.props.Condition.eval(e.access))
      );
    }
    stream$.pipe(takeUntil(stop$)).subscribe((e) => this.respond(e));
  }

  /**
   * @param {string} signal
   * @param {Subject} stop$
   */
  configureTimer(signal, stop$) {}

  /**
   * @param {string} signal
   * @param {Subject} stop$
   */
  configureOther(signal, stop$) {}

  /** @param {Event & { access: Object }} event */
  respond(event) {
    for (const response of this.responses) {
      response.respond(event);
    }
  }
}
TreeBase.register(Handler);

class HandlerCondition extends TreeBase {
  props = {
    Condition: new Expression("", { hiddenLabel: true }),
  };

  template() {
    const { Condition } = this.props;
    return html`
      <div class="Condition">
        ${Condition.input()}
        ${this.deleteButton({ title: "Delete this condition" })}
      </div>
    `;
  }

  /** @param {Object} context */
  eval(context) {
    return this.props.Condition.eval(context);
  }
}
TreeBase.register(HandlerCondition);

class HandlerKey extends TreeBase {
  props = {
    Key: new Select(allKeys, { hiddenLabel: true }),
  };

  template() {
    const { Key } = this.props;
    return html`
      <div class="Key">
        ${Key.input()} ${this.deleteButton({ title: "Delete this key" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerKey);

css`
  details.Method > *:not(summary) {
    margin-left: 2em;
  }
`;
