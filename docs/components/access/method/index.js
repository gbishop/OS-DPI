import { html } from "../../../_snowpack/pkg/uhtml.js";
import css from "../../../_snowpack/pkg/ustyler.js";
import { Base } from "../../base.js";
import { TreeBase } from "../../treebase.js";
import { String, Float, UID, Boolean } from "../../props.js";
import Globals from "../../../globals.js";
import db from "../../../db.js";
import { Subject } from "../../../_snowpack/pkg/rxjs.js";
import { Handler } from "./handler.js";
import { KeyHandler } from "./keyHandler.js";
import { PointerHandler } from "./pointerHandler.js";
import { TimerHandler } from "./timerHandler.js";
import { EventWrap } from "../index.js";

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
    const fallback = {
      className: "MethodChooser",
      props: {
        currentIndex: -1,
      },
      children: [],
    };
    const method = await db.read("method", fallback);
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
}
TreeBase.register(MethodChooser);

export class Method extends TreeBase {
  Name = new String("New method");
  Key = new UID();
  Active = new Boolean(false);

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

  template() {
    const { Name, Active } = this;
    return html`<details
      class="Method"
      ?open=${this.open}
      ontoggle=${({ target }) => (this.open = target.open)}
    >
      <summary>
        ${Name.value}
        ${Active.value == "true" ? html`&check;` : html`<!--empty-->`}
      </summary>
      <div class="Method">
        ${Name.input()} ${Active.input()}
        ${this.deleteButton({ title: "Delete this method" })}
        <fieldset>
          <legend>
            Timers ${this.addChildButton("+", Timer, { title: "Add a timer" })}
          </legend>
          ${this.unorderedChildren([...this.timers.values()])}
        </fieldset>
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
      </div>
    </details>`;
  }

  /** Configure the rxjs pipelines to implement this method */
  /** @param {Subject} stop$ */
  configure(stop$) {
    if (this.Active.value == "true") {
      for (const child of this.handlers) {
        child.configure(stop$);
      }
    }
  }
}
TreeBase.register(Method);

class Timer extends TreeBase {
  Interval = new Float(0.5, { hiddenLabel: true });
  Name = new String("timer", { hiddenLabel: true });
  Key = new UID();

  /** @type {Subject<WrappedEvent>} */
  subject$ = new Subject();

  template() {
    return html`${this.Name.input()} ${this.Interval.input()}
      ${this.deleteButton()}
      <style>
        ${`:root { --${this.Key.value}: ${this.Interval.value}s}`}
      </style> `;
  }

  /** @param {Object} access */
  start(access) {
    const event = EventWrap(new Event("timer"));
    event.access = access;
    this.subject$.next(event);
  }

  cancel() {
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
