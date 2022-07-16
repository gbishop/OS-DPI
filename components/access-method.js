import { html } from "uhtml";
import { Base } from "./base";
import { TreeBase } from "./treebase";
import { Select, Expression, String, Integer, Float, UID } from "./props";
import Globals from "../globals";
import db from "../db";
import { extender } from "proxy-pants";
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

export class AccessMethod extends Base {
  template() {
    return html`<div class="access-method treebase">
      ${Globals.method.template()}
    </div>`;
  }
}

export class MethodChooser extends TreeBase {
  props = {
    currentMethodKey: new String(),
  };

  /** @type {Method} */
  get currentMethod() {
    const { currentMethodKey } = this.props;
    if (!currentMethodKey.value && this.children.length > 0) {
      currentMethodKey.set(this.children[0].props.Key.value);
    }
    const r = this.children.find(
      (child) => child.props.Key.value == currentMethodKey.value
    );
    return r;
  }

  /** @type {Method[]} */
  children = [];

  update() {
    db.write("method", this.toObject());
    if (this.currentMethod) {
      this.currentMethod.configure();
    }
    Globals.state.update();
  }

  init() {
    console.log("method chooser init");
    super.init();
    if (this.currentMethod) {
      console.log("calling configure");
      this.currentMethod.configure();
    }
  }

  template() {
    const { currentMethodKey } = this.props;

    return html`<div class="MethodChooser" onChange=${() => this.update()}>
      <label
        >Access Method
        <select
          onChange=${(/** @type {{ target: { value: string } }} */ e) => {
            currentMethodKey.set(e.target.value);
          }}
        >
          ${this.children.map(
            (child) =>
              html`<option
                value=${child.props.Key.value}
                ?selected=${currentMethodKey.value == child.props.Key.value}
              >
                ${child.props.Name.value}
              </option>`
          )}
        </select></label
      >
      ${this.addChildButton("+Method", Method, {
        title: "Create a new access method",
        onClick: () =>
          currentMethodKey.set(
            this.children[this.children.length - 1].props.Key.value
          ),
      })}
      ${this.currentMethod ? this.currentMethod.template() : html``}
    </div> `;
  }
}
TreeBase.register(MethodChooser);

const KeyProto = {
  access: {},
};

const KeyWrap = extender(KeyProto);

class Method extends TreeBase {
  props = {
    Name: new String("New method"),
    Key: new UID(),
    Debounce: new Float(0.5),
  };

  /** @type {(Handler | Timer)[]} */
  children = [];

  stop$ = new Subject();

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
    const { Name } = this.props;
    return html`<fieldset class="Method">
      <legend>${Name.value}</legend>
      ${Name.input()}
      <fieldset>
        <legend>
          Timers ${this.addChildButton("+", Timer, { title: "Add a timer" })}
        </legend>
        <ul>
          <li>${this.props.Debounce.input()}</li>
          ${this.listChildren(this.timers)}
        </ul>
      </fieldset>
      <fieldset>
        <legend>
          Handlers
          ${this.addChildButton("+", Handler, { title: "Add a handler" })}
        </legend>
        ${this.orderedChildren(this.handlers)}
      </fieldset>
    </fieldset>`;
  }

  /** Configure the rxjs pipelines to implement this method */
  configure() {
    console.log("configure");

    // shutdown any previous pipeline
    this.stop$.next();

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
    this.key$ = /** @type Observable<KeyboardEvent> */ (
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
    pointerDown$.pipe(takeUntil(this.stop$)).subscribe(
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
        takeUntil(this.stop$)
      )
      .subscribe((e) => e.preventDefault());

    /**
     * Creates a stream of conditioned hover events
     *
     * @param {number} Thold - Pointer must remain in/out this long
     * @param {Observable<Partial<PointerEvent>>} enterLeave$ - Merged stream of
     *   enter and leave events
     *
     *   We use groupBy to create a stream for each target and then debounce the
     *   streams independently before merging them back together. The final
     *   distinctUntilKeyChanged prevents producing multiple enter events when
     *   the pointer leaves and re-enters in a short time.
     */
    function hoverStream(Thold, enterLeave$) {
      return enterLeave$.pipe(
        groupBy((e) => e.target),
        mergeMap(($group) =>
          $group.pipe(debounceTime(Thold), distinctUntilKeyChanged("type"))
        )
      );
    }

    for (const handler of this.handlers) {
      const signal = handler.props.Signal.value;
      let stream$;
      if (signal == "keyup" || signal == "keydown") {
        const keys = handler.keys.map((key) => key.props.Key.value);
        stream$ = this.key$.pipe(
          filter(
            (e) =>
              e.type == signal && (keys.length == 0 || keys.indexOf(e.key) >= 0)
          ),
          map((e) => {
            // add context info to event for use in the response
            const kw = KeyWrap(e);
            kw.access = { key: e.key };
	    return kw;
          })
        );
        for (const condition of handler.conditions) {
          stream$ = stream$.pipe(
            filter((e) => condition.props.Condition.eval(e))
          );
        }
        stream$
          .pipe(takeUntil(this.stop$))
          .subscribe((e) => handler.respond(e));
      } else if (signal == "pointerover" || signal == "pointerout") {
        stream$ = pointerOverOut$.pipe(
          filter((e) => e.type == signal),
          map((e) => ButtonWrap(e.target))
        );
        for (const condition of handler.conditions) {
          stream$ = stream$.pipe(
            filter((e) => condition.props.Condition.eval(e))
          );
        }
        stream$
          .pipe(takeUntil(this.stop$))
          .subscribe((e) => handler.respond(e));
      }
    }
  }

  update() {
    super.update();
    this.configure();
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
    const { Signal } = this.props;
    let keyBlock = html``;
    console.log({ Signal });
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
        ${Signal.input()} ${this.deleteButton({ title: "Delete this handler" })}
        ${keyBlock}
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

  respond(e) {
    console.log("respond", e);
    for (const response of this.responses) {
      response.respond(e);
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

const allResponses = {
  next: () => Globals.pattern.next(),
  activate: () => Globals.pattern.activate(),
  emit: ({context}) => Globals.rules.applyRules("keyevent", "press", context),
  cue: (e) => e.cue(),
};

class HandlerResponse extends TreeBase {
  props = {
    Response: new Select(Object.keys(allResponses), { hiddenLabel: true }),
  };

  template() {
    const { Response } = this.props;
    return html`
      <div class="Response">
        ${Response.input()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }

  respond(e) {
    const verb = this.props.Response.value;
    const func = allResponses[verb];
    console.log({ verb, func });
    if (func) func(e);
  }
}
TreeBase.register(HandlerResponse);
