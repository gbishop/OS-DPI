import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import * as Props from "components/props";
import Globals from "app/globals";
import * as RxJs from "rxjs";
// make sure the classes are registered
import defaultMethods from "./defaultMethods";
import { DesignerPanel } from "components/designer";
import "css/method.css";
import { toggleIndicator } from "app/components/helpers";

// allow tearing down handlers when changing configurations
const stop$ = new RxJs.Subject();

export class MethodChooser extends DesignerPanel {
  name = new Props.String("Methods");

  allowedChildren = ["Method"];
  /** @type {Method[]} */
  children = [];

  allowDelete = false;

  static tableName = "method";
  static defaultValue = defaultMethods;

  onUpdate() {
    super.onUpdate();
    this.configure();
  }

  configure() {
    // tear down the old configuration if any
    this.stop();
    for (const method of this.children) {
      method.configure(stop$);
    }
  }

  stop() {
    stop$.next(1);
  }

  settings() {
    return html`<div class="MethodChooser" id=${this.id}>
      ${this.unorderedChildren()}
    </div> `;
  }

  refresh() {
    this.children
      .filter((child) => child.Active.value)
      .forEach((child) => child.refresh());
  }

  /**
   * Upgrade Methods
   * @param {any} obj
   * @returns {Object}
   */
  static upgrade(obj) {
    // Debounce moves up to the method from the individual handlers
    // Take the maximum of all times for each category
    if (obj.className != "MethodChooser") return obj;

    for (const method of obj.children) {
      if (method.className != "Method") {
        throw new Error("Invalid Method upgrade");
      }
      if (!("KeyDebounce" in method.props)) {
        let keyDebounce = 0;
        let enterDebounce = 0;
        let downDebounce = 0;
        for (const handler of method.children) {
          if (["PointerHandler", "KeyHandler"].includes(handler.className)) {
            const debounce = parseFloat(handler.props.Debounce || "0");
            const signal = handler.props.Signal;
            if (signal.startsWith("key")) {
              keyDebounce = Math.max(keyDebounce, debounce);
            } else if (["pointerover", "pointerout"].includes(signal)) {
              enterDebounce = Math.max(enterDebounce, debounce);
            } else if (["pointerdown", "pointerup"].includes(signal)) {
              downDebounce = Math.max(downDebounce, debounce);
            }
          }
        }
        method.props.KeyDebounce = keyDebounce.toString();
        method.props.PointerEnterDebounce = enterDebounce.toString();
        method.props.PointerDownDebounce = downDebounce.toString();
      }
      if (!("Pattern" in method.props)) {
        /* guess the best pattern to use
         * Prior to this upgrade PointerHandlers ignored the pattern. Now they don't.
         * To avoid breaking Methods that using PointerHandlers I'm defaulting them
         * to the NullPattern. This won't fix everything for sure but it shoudl help.
         */
        let pattern = "DefaultPattern";
        if (
          method.children.some(
            (/** @type {Object} */ handler) =>
              handler.className == "PointerHandler",
          )
        ) {
          pattern = "NullPattern";
        }
        method.props.Pattern = pattern;
      }
    }
    return obj;
  }
}
TreeBase.register(MethodChooser, "MethodChooser");

export class Method extends TreeBase {
  Name = new Props.String("New method");
  Pattern = new Props.Pattern({ defaultValue: "DefaultPattern" });
  KeyDebounce = new Props.Float(0, { label: "Key down/up" });
  PointerEnterDebounce = new Props.Float(0, { label: "Pointer enter/leave" });
  PointerDownDebounce = new Props.Float(0, { label: "Pointer down/up" });
  Key = new Props.UID();
  Active = new Props.Boolean(false);

  allowedChildren = [
    "Timer",
    "KeyHandler",
    "PointerHandler",
    "TimerHandler",
    "SocketHandler",
  ];

  open = false;

  // Event streams from the devices
  /** @type {Object<string, RxJs.Observable<EventLike>>} */
  streams = {};

  /** clear the pointerStream on any changes from below
   * @param {TreeBase} _start
   */
  onUpdate(_start) {
    super.onUpdate(_start);
  }

  /** @type {(Handler | Timer)[]} */
  children = [];

  /** Return a Map from Timer Key to the Timer
   * @returns {Map<string, Timer>}
   * */
  get timers() {
    return new Map(
      this.filterChildren(Timer).map((child) => [child.Key.value, child]),
    );
  }

  /** Return a Map from Timer Key to its Name */
  get timerNames() {
    return new Map(
      this.filterChildren(Timer).map((timer) => [
        timer.Key.value,
        timer.Name.value,
      ]),
    );
  }

  /** Return a Timer given its key
   *     @param {string} key
   *  */
  timer(key) {
    return this.filterChildren(Timer).find((timer) => timer.Key.value == key);
  }

  /** Cancel all active Timers
   */
  cancelTimers() {
    for (const timer of this.timers.values()) {
      timer.cancel();
    }
  }

  /** Return an array of the Handlers */
  get handlers() {
    return this.filterChildren(Handler);
  }

  settingsSummary() {
    const { Name, Active } = this;
    return html`<h3>
      ${Name.value} ${toggleIndicator(Active.value, "Active")}
    </h3>`;
  }

  settingsDetails() {
    const {
      Name,
      Pattern,
      Active,
      KeyDebounce,
      PointerEnterDebounce,
      PointerDownDebounce,
    } = this;
    const timers = [...this.timers.values()];
    // determine which debounce controls we should display
    const handlerClasses = new Set(
      this.handlers.map((handler) => handler.className),
    );
    const keyDebounce = handlerClasses.has("KeyHandler")
      ? [KeyDebounce.input()]
      : [];
    const pointerDebounce = handlerClasses.has("PointerHandler")
      ? [PointerDownDebounce.input(), PointerEnterDebounce.input()]
      : [];
    const Debounce =
      handlerClasses.has("KeyHandler") || handlerClasses.has("PointerHandler")
        ? [
            html`<fieldset>
              <legend>Debounce</legend>
              ${keyDebounce} ${pointerDebounce}
            </fieldset> `,
          ]
        : [];
    return html`<div>
      ${Name.input()} ${Active.input()} ${Pattern.input()} ${Debounce}
      ${timers.length > 0
        ? html`<fieldset>
            <legend>Timers</legend>
            ${this.unorderedChildren(timers)}
          </fieldset>`
        : this.empty}
      <fieldset>
        <legend>Handlers</legend>
        ${this.orderedChildren(this.handlers)}
      </fieldset>
    </div>`;
  }

  settingsChildren() {
    return this.empty;
  }

  /** Configure the rxjs pipelines to implement this method */
  /** @param {RxJs.Subject} stop$
   * */
  configure(stop$) {
    if (this.Active.value) {
      this.streams = {};
      for (const child of this.handlers) {
        child.configure(stop$);
      }
      const streams = Object.values(this.streams);
      if (streams.length > 0) {
        const stream$ = RxJs.merge(...streams).pipe(RxJs.takeUntil(stop$));
        stream$.subscribe((e) => {
          for (const handler of this.handlers) {
            if (handler.test(e)) {
              handler.respond(e);
              return;
            }
          }
        });
      }
    }
  }

  get pattern() {
    return Globals.patterns.patternFromKey(this.Pattern.value);
  }

  /** Refresh the pattern and other state on redraw */
  refresh() {
    this.pattern.refresh();
  }
}
TreeBase.register(Method, "Method");

class Timer extends TreeBase {
  Interval = new Props.Float(0.5, { hiddenLabel: true });
  Name = new Props.String("timer", { hiddenLabel: true });
  Key = new Props.UID();

  /** @type {RxJs.Subject<EventLike>} */
  subject$ = new RxJs.Subject();

  settings() {
    return html`<div>
      ${this.Name.input()} ${this.Interval.input()}
      <style>
        ${`:root { --${this.Key.value}: ${this.Interval.value}s}`}
      </style>
    </div>`;
  }

  /** @param {EventLike} event */
  start(event) {
    const fakeEvent = /** @type {EventLike} */ ({
      type: "timer",
      target: event.target,
      access: event.access,
    });
    this.subject$.next(fakeEvent);
  }

  cancel() {
    const event = { type: "cancel", target: null, timeStamp: 0 };
    this.subject$.next(event);
  }
}
TreeBase.register(Timer, "Timer");

/** Handler is a base class for all event handlers */
export class Handler extends TreeBase {
  /** @type {(HandlerCondition | HandlerKeyCondition | HandlerResponse)[]} */
  children = [];

  /** Return the method containing this Handler */
  get method() {
    return /** @type {Method} */ (this.parent);
  }

  // overridden in the derived classes
  Signal = new Props.Select();

  get conditions() {
    return this.filterChildren(HandlerCondition);
  }

  get keys() {
    return this.filterChildren(HandlerKeyCondition);
  }

  get responses() {
    return this.filterChildren(HandlerResponse);
  }

  /**
   * Test the conditions for this handler
   * @param {EventLike} event
   * @returns {boolean}
   */
  test(event) {
    return (
      this.Signal.value == event.type &&
      this.conditions.every((condition) => condition.eval(event.access))
    );
  }

  /**
   * @param {RxJs.Subject} _stop$
   * */
  configure(_stop$) {
    throw new TypeError("Must override configure");
  }

  /** @param {EventLike} event */
  respond(event) {
    // console.log("handler respond", event.type, this.responses);
    const method = this.nearestParent(Method);
    if (!method) return;
    method.cancelTimers();
    for (const response of this.responses) {
      response.respond(event);
    }
  }
}

export class HandlerCondition extends TreeBase {
  Condition = new Props.Expression("", { hiddenLabel: true });

  settings() {
    const { Condition } = this;
    return html`<div class="Condition">${Condition.input()}</div>`;
  }

  /** @param {Object} context */
  eval(context) {
    return this.Condition.eval(context);
  }

  /** move my parent instead of me.
   * @param {boolean} up
   */
  moveUpDown(up) {
    this.parent?.moveUpDown(up);
  }
}
TreeBase.register(HandlerCondition, "HandlerCondition");

export class HandlerKeyCondition extends HandlerCondition {
  Key = new Props.KeyName("", {
    placeholder: "Press Enter to edit",
    hiddenLabel: true,
  });

  settings() {
    const { Key } = this;
    return html`<div class="Key">${Key.input()}</div>`;
  }

  /** @param {Object} context */
  eval(context) {
    return this.Key.value == context.key;
  }
}
TreeBase.register(HandlerKeyCondition, "HandlerKeyCondition");

const ResponderTypeMap = new Map([
  ["HandlerResponse", "none"],
  ["ResponderCue", "cue"],
  ["ResponderActivate", "activate"],
  ["ResponderClearCue", "clear cue"],
  ["ResponderEmit", "emit"],
  ["ResponderNext", "next"],
  ["ResponderStartTimer", "start timer"],
]);

export class HandlerResponse extends TreeBaseSwitchable {
  Response = new Props.TypeSelect(ResponderTypeMap, { hiddenLabel: true });

  /** @param {EventLike} event */
  respond(event) {
    console.log("no response for", event);
  }

  settings() {
    return html`<div class="Response">
      ${this.Response.input()} ${this.subTemplate()}
    </div>`;
  }

  subTemplate() {
    return this.empty;
  }

  /** move my parent instead of me.
   * @param {boolean} up
   */
  moveUpDown(up) {
    this.parent?.moveUpDown(up);
  }
}
TreeBase.register(HandlerResponse, "HandlerResponse");
