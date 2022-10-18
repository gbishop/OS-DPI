import { html } from "uhtml";
import css from "ustyler";
import { TreeBase } from "../../../treebase";
import * as Props from "../../../props";
import Globals from "../../../../globals";
import db from "../../../../db";
import * as RxJs from "rxjs";
import { Handler } from "./handler";
import { KeyHandler } from "./keyHandler";
import { PointerHandler } from "./pointerHandler";
import { TimerHandler } from "./timerHandler";
import { EventWrap } from "../index";
// make sure the classes are registered
import "./handler";
import "./responses";
import defaultMethods from "./defaultMethods";
import { log } from "../../../../log";
import { TabPanel } from "../../../tabcontrol";

export class MethodChooser extends TabPanel {
  name = new Props.String("Methods");

  /** @type {Method[]} */
  children = [];

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
      ${this.children.map((child) => child.settings())}
    </div> `;
  }

  refresh() {
    this.children
      .filter((child) => child.Active.value)
      .forEach((child) => child.refresh());
  }
}
TreeBase.register(MethodChooser);

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

  settings() {
    const { Name, Active, Pattern } = this;
    const timers = [...this.timers.values()];
    return html`<fieldset class="Method" id=${this.id}>
      ${Name.input()} ${Active.input()}
      ${Pattern.input(Globals.patterns.patternMap)}
      <details>
        <summary>Details</summary>
        ${timers.length > 0
          ? html`<fieldset>
              <legend>
                Timers
                ${this.addChildButton("+", Timer, { title: "Add a timer" })}
              </legend>
              ${this.unorderedChildren(timers)}
            </fieldset>`
          : html`Timers
            ${this.addChildButton("+", Timer, { title: "Add a timer" })}`}
        <fieldset>
          <legend>
            Handlers
            ${this.addChildButton("+Key", KeyHandler, {
              title: "Add a key handler",
            })}
            ${this.addChildButton("+Pointer", PointerHandler, {
              title: "Add a pointer handler",
            })}
            ${this.addChildButton("+Timer", TimerHandler, {
              title: "Add a timer handler",
            })}
          </legend>
          ${this.orderedChildren(this.handlers)}
        </fieldset>
      </details>
    </fieldset> `;
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
TreeBase.register(Method);

class Timer extends TreeBase {
  Interval = new Props.Float(0.5, { hiddenLabel: true });
  Name = new Props.String("timer", { hiddenLabel: true });
  Key = new Props.UID();

  /** @type {RxJs.Subject<WrappedEvent>} */
  subject$ = new RxJs.Subject();

  settings() {
    return html`${this.Name.input()} ${this.Interval.input()}
      ${this.deleteButton()}
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
TreeBase.register(Timer);

css`
  details.Method > *:not(summary) {
    margin-left: 2em;
  }
`;
