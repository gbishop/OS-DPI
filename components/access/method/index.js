import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import * as Props from "components/props";
import Globals from "app/globals";
import * as RxJs from "rxjs";
import { EventWrap } from "../index";
// make sure the classes are registered
import defaultMethods from "./defaultMethods";
import { DesignerPanel } from "components/designer";
import "css/method.css";
import { toggleIndicator } from "app/components/helpers";

export class MethodChooser extends DesignerPanel {
  name = new Props.String("Methods");

  allowedChildren = ["Method"];
  /** @type {Method[]} */
  children = [];

  allowDelete = false;

  // allow tearing down handlers when changing configurations
  stop$ = new RxJs.Subject();

  static tableName = "method";
  static defaultValue = defaultMethods;

  onUpdate() {
    super.onUpdate();
    this.configure();
  }

  configure() {
    // tear down the old configuration if any
    this.stop$.next(1);
    for (const method of this.children) {
      method.configure(this.stop$);
    }
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
}
TreeBase.register(MethodChooser, "MethodChooser");

export class Method extends TreeBase {
  Name = new Props.String("New method");
  Key = new Props.UID();
  Active = new Props.Boolean(false);

  allowedChildren = ["Timer", "KeyHandler", "PointerHandler", "TimerHandler"];

  open = false;

  /** @type {(Handler | Timer)[]} */
  children = [];

  /** Return a Map from Timer Key to the Timer
   * @returns {Map<string, Timer>}
   * */
  get timers() {
    return new Map(
      this.filterChildren(Timer).map((child) => [child.Key.value, child])
    );
  }

  /** Return a Map from Timer Key to its Name */
  get timerNames() {
    return new Map(
      this.filterChildren(Timer).map((timer) => [
        timer.Key.value,
        timer.Name.value,
      ])
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
    const { Name, Active } = this;
    const timers = [...this.timers.values()];
    return html`<div>
      ${Name.input()} ${Active.input()}
      ${timers.length > 0
        ? html`<fieldset>
            <legend>Timers</legend>
            ${this.unorderedChildren(timers)}
          </fieldset>`
        : html`<!--empty-->`}
      <fieldset>
        <legend>Handlers</legend>
        ${this.orderedChildren(this.handlers)}
      </fieldset>
    </div>`;
  }

  settingsChildren() {
    return html`<!--empty-->`;
  }

  /** Configure the rxjs pipelines to implement this method */
  /** @param {RxJs.Subject} stop$
   * */
  configure(stop$) {
    if (this.Active.value) {
      for (const child of this.handlers) {
        child.configure(stop$);
      }
    }
  }

  /** Refresh the pattern and other state on redraw */
  refresh() {
    Globals.patterns.activePattern.refresh();
  }
}
TreeBase.register(Method, "Method");

class Timer extends TreeBase {
  Interval = new Props.Float(0.5, { hiddenLabel: true });
  Name = new Props.String("timer", { hiddenLabel: true });
  Key = new Props.UID();

  /** @type {RxJs.Subject<WrappedEvent>} */
  subject$ = new RxJs.Subject();

  settings() {
    return html`${this.Name.input()} ${this.Interval.input()}
      <style>
        ${`:root { --${this.Key.value}: ${this.Interval.value}s}`}
      </style> `;
  }

  /** @param {Event & { access: {}}} event */
  start(event) {
    console.log("start timer");
    const fakeEvent = /** @type {Event} */ ({
      type: "timer",
      target: event.target,
    });
    const tevent = EventWrap(fakeEvent);
    tevent.access = event.access;
    this.subject$.next(tevent);
  }

  cancel() {
    console.log("cancel timer");
    const event = EventWrap(new Event("cancel"));
    this.subject$.next(event);
  }
}
TreeBase.register(Timer, "Timer");

/** Handler is a base class for all event handlers */
export class Handler extends TreeBase {
  /** @type {(HandlerCondition | HandlerKeyCondition | HandlerResponse)[]} */
  children = [];

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
   * @param {RxJs.Subject} _stop$
   * */
  configure(_stop$) {
    throw new TypeError("Must override configure");
  }

  /** @param {WrappedEvent} event */
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
    return html` <div class="Condition">${Condition.input()}</div> `;
  }

  /** @param {Object} context */
  eval(context) {
    return this.Condition.eval(context);
  }
}
TreeBase.register(HandlerCondition, "HandlerCondition");

const allKeys = new Map([
  [" ", "Space"],
  ["Enter", "Enter"],
  ["ArrowLeft", "Left Arrow"],
  ["ArrowRight", "Right Arrow"],
  ["ArrowUp", "Up Arrow"],
  ["ArrowDown", "Down Arrow"],
]);

export class HandlerKeyCondition extends TreeBase {
  Key = new Props.Select(allKeys, { hiddenLabel: true });

  settings() {
    const { Key } = this;
    return html` <div class="Key">${Key.input()}</div> `;
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

  /** @param {Event & { access: Object }} event */
  respond(event) {
    console.log("no response for", event);
  }

  settings() {
    return html`
      <div class="Response">${this.Response.input()} ${this.subTemplate()}</div>
    `;
  }

  subTemplate() {
    return html`<!--empty-->`;
  }
}
TreeBase.register(HandlerResponse, "HandlerResponse");
