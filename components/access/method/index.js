import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "components/treebase";
import * as Props from "components/props";
import Globals from "app/globals";
import db from "app/db";
import * as RxJs from "rxjs";
import { EventWrap } from "../index";
// make sure the classes are registered
import defaultMethods from "./defaultMethods";
import { log } from "app/log";
import { TabPanel } from "components/tabcontrol";
import "css/method.css";

export class MethodChooser extends TabPanel {
  name = new Props.String("Methods");

  allowedChildren = ["Method"];
  /** @type {Method[]} */
  children = [];

  allowDelete = false;

  // allow tearing down handlers when changing configurations
  stop$ = new RxJs.Subject();

  onUpdate() {
    console.log("update method", this);
    db.write("method", this.toObject());
    this.configure();
    Globals.state.update();
  }

  configure() {
    // tear down the old configuration if any
    this.stop$.next();
    for (const method of this.children) {
      method.configure(this.stop$);
    }
  }

  /**
* Load the MethodChooser from the db
  @returns {Promise<MethodChooser>}
*/
  static async load() {
    const method = await db.read("method", defaultMethods);
    const result = /** @type {MethodChooser} */ (this.fromObject(method));
    result.configure();
    return result;
  }

  template() {
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
  Pattern = new Props.Select();

  open = false;

  /** @type {(Handler | Timer)[]} */
  children = [];

  /** Return the Pattern for this method
   * @returns {import('../pattern/index.js').PatternManager}
   */
  get pattern() {
    const r = Globals.patterns.byKey(this.Pattern.value);
    return r;
  }

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

  // settings() {
  //   const { Name, Active, Pattern } = this;
  //   const timers = [...this.timers.values()];
  //   return html`<fieldset class="Method" id=${this.id}>
  //     ${Name.input()} ${Active.input()}
  //     ${Pattern.input(Globals.patterns.patternMap)}
  //     <details open>
  //       <summary>Details</summary>
  //       ${timers.length > 0
  //         ? html`<fieldset>
  //             <legend>Timers</legend>
  //             ${this.unorderedChildren(timers)}
  //           </fieldset>`
  //         : html`Timers`}
  //       <fieldset>
  //         <legend>Handlers</legend>
  //         ${this.orderedChildren(this.handlers)}
  //       </fieldset>
  //     </details>
  //   </fieldset> `;
  // }

  settingsSummary() {
    const { Name, Active } = this;
    return html`<h3>${Name.value} ${Active.input({ hiddenLabel: true })}</h3>`;
  }

  settingsDetails() {
    const { Name, Active, Pattern } = this;
    const timers = [...this.timers.values()];
    return html`<div>
      ${Name.input()} ${Active.input()}
      ${Pattern.input(Globals.patterns.patternMap)}
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
    this.pattern.refresh();
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
    log("start timer");
    const fakeEvent = /** @type {Event} */ ({
      type: "timer",
      target: event.target,
    });
    const tevent = EventWrap(fakeEvent);
    tevent.access = event.access;
    this.subject$.next(tevent);
  }

  cancel() {
    log("cancel timer");
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
  ["ResponderPatternNext", "pattern next"],
  ["ResponderPatternActivate", "pattern activate"],
  ["ResponderPatternCue", "pattern cue"],
  ["ResponderCue", "cue"],
  ["ResponderActivate", "activate"],
  ["ResponderClearCue", "clear cue"],
  ["ResponderEmit", "emit"],
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

  get pattern() {
    const method = this.nearestParent(Method);
    return method.pattern;
  }

  subTemplate() {
    return html`<!--empty-->`;
  }
}
TreeBase.register(HandlerResponse, "HandlerResponse");
