import { html } from "uhtml";
import { Base } from "./base";
import { TreeBase } from "./treebase";
import { Select, Expression, String, Integer, Float, UID } from "./props";
import Globals from "../globals";
import db from "../db";
import {
  debounceTime,
  delayWhen,
  filter,
  from,
  interval,
  map,
  Observable,
  share,
  distinctUntilKeyChanged,
  groupBy,
  mergeMap,
  fromEvent,
  mergeWith,
  Subject,
  takeUntil,
  tap,
} from "rxjs";

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
    console.log("currentMethod", r);
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

class Method extends TreeBase {
  props = {
    Name: new String("New method"),
    Key: new UID(),
    Debounce: new Float(0.5),
  };

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

  init() {
    super.init();

    console.log("init");

    this.stop$ = new Subject();

    // construct debounced key event stream
    const debounceInterval = this.props.Debounce.valueAsNumber;
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

    /** @type Observable<KeyboardEvent> */
    this.key$ = /** @type Observable<KeyboardEvent> */ (
      keyDown$.pipe(
        mergeWith(keyUp$),
        filter((e) => !e.repeat && notDesigner(e)),
        groupBy((e) => e.key),
        mergeMap((group$) => group$.pipe(debounceTime(debounceInterval)))
      )
    );

    this.configure();
  }

  /** Configure the rxjs pipelines to implement this method */
  configure() {
    console.log("configure");

    // shutdown any previous pipeline
    this.stop$.next();

    for (const handler of this.handlers) {
      const signal = handler.props.Signal.value;
      if (signal == "keyup" || signal == "keydown") {
        let stream$ = this.key$.pipe(filter((e) => e.type == signal));
        for (const key of handler.keys) {
          const k = key.props.Key.value;
          stream$ = stream$.pipe(filter((e) => e.key == k));
        }
        stream$
          .pipe(takeUntil(this.stop$))
          .subscribe((/** @type {KeyboardEvent} */ e) => handler.respond(e));
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

const allSignals = ["keyup", "keydown"];

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
    if (Signal.value.startsWith("key")) {
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
    for (const condition of this.conditions) {
      const r = condition.props.Condition.eval({ key: e.key });
      console.log("condition", r, condition);
      if (!r) return;
    }
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
    if (func) func();
  }
}
TreeBase.register(HandlerResponse);
