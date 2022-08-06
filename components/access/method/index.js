import { html } from "uhtml";
import css from "ustyler";
import { Base } from "../../base";
import { TreeBase } from "../../treebase";
import { String, Float, UID, Boolean } from "../../props";
import Globals from "../../../globals";
import db from "../../../db";
import { Subject, Observable } from "rxjs";
import { Handler } from "./handler";
import { KeyHandler } from "./keyHandler";
import { PointerHandler } from "./pointerHandler";
import { TimerHandler } from "./timerHandler";
import { EventWrap } from "../index";

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
    console.log("update method", this);
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
    if (this.props.Active.value == "true") {
      for (const child of this.handlers) {
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

  /** @type {Subject<WrappedEvent>} */
  subject$ = new Subject();

  template() {
    return html`${this.props.Name.input()} ${this.props.Interval.input()}
    ${this.deleteButton()}`;
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
