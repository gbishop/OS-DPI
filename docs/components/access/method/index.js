import { html } from "../../../_snowpack/pkg/uhtml.js";
import css from "../../../_snowpack/pkg/ustyler.js";
import { Base } from "../../base.js";
import { TreeBase } from "../../treebase.js";
import * as Props from "../../props.js";
import Globals from "../../../globals.js";
import db from "../../../db.js";
import * as RxJs from "../../../_snowpack/pkg/rxjs.js";
import { Handler } from "./handler.js";
import { KeyHandler } from "./keyHandler.js";
import { PointerHandler } from "./pointerHandler.js";
import { TimerHandler } from "./timerHandler.js";
import { EventWrap } from "../index.js";
import defaultMethods from "./defaultMethods.js";
import { log } from "../../../log.js";

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
    return html`<div class="MethodChooser">
      ${this.addChildButton("Add Method", Method, {
        title: "Create a new access method",
      })}
      ${this.children.map((child) => child.template())}
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

  template() {
    const { Name, Active, Pattern } = this;
    const timers = [...this.timers.values()];
    return html`<fieldset class="Method">
      ${Name.input()} ${Active.input()}
      ${Pattern.input(Globals.patterns.patternMap)}
      ${this.deleteButton({ title: "Delete this method" })}
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

  template() {
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
