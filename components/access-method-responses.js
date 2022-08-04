import { html } from "uhtml";
import { TreeBase } from "./treebase";
import Globals from "../globals";
import {
  Select,
  Expression,
  String,
  Integer,
  Float,
  UID,
  Boolean,
} from "./props";
import { Method } from "./access-method";

class Responder extends TreeBase {
  static title = "none";

  /** @param {Event & { access: Object }} event */
  respond(event) {
    console.log("no response for", event);
  }

  template() {
    return html``;
  }
}

class ResponderNext extends Responder {
  static title = "next";

  respond() {
    Globals.pattern.next();
  }
}
TreeBase.register(ResponderNext);

class ResponderActivate extends Responder {
  static title = "activate";

  respond() {
    Globals.pattern.activate();
  }
}
TreeBase.register(ResponderActivate);

class ResponderCue extends Responder {
  static title = "cue";

  /** @param {Event & { access: Object }} event */
  respond(event) {
    Globals.pattern.setCurrent(event.target);
    Globals.pattern.cue();
  }
}
TreeBase.register(ResponderCue);

class ResponderClearCue extends Responder {
  static title = "clear cue";

  respond() {
    Globals.pattern.clearCue();
  }
}
TreeBase.register(ResponderClearCue);

class ResponderEmit extends Responder {
  static title = "emit";

  respond({ access }) {
    Globals.rules.applyRules(access.type, "press", access);
  }
}
TreeBase.register(ResponderEmit);

class ResponderStartTimer extends Responder {
  static title = "start timer";

  props = {
    TimerName: new Select([], { hiddenLabel: true }), // filled in later from the timers
  };

  template() {
    const timers = new Map(
      this.nearestParent(Method).timers.map((timer) => [
        timer.props.Key.value,
        timer.props.Name.value,
      ])
    );
    return html`${this.props.TimerName.input(timers)}`;
  }
}
TreeBase.register(ResponderStartTimer);

const allResponders = [
  Responder,
  ResponderNext,
  ResponderActivate,
  ResponderEmit,
  ResponderCue,
  ResponderClearCue,
  ResponderStartTimer,
];

export class HandlerResponse extends TreeBase {
  /** @type {Responder[]} */
  children = [];

  template() {
    const current = this.children[0];
    return html`
      <div class="Response">
        <label hiddenLabel>
          <span>Response</span>
          <select
            onchange=${({ target }) => this.updateResponder(target.value)}
          >
            ${allResponders.map(
              (constructor) =>
                html`<option
                  ?selected=${constructor.name === current.constructor.name}
                  value=${constructor.name}
                >
                  ${constructor.title}
                </option>`
            )}
          </select>
        </label>
        ${current.template()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }

  init() {
    super.init();
    if (!this.children.length) {
      this.addChild(new Responder());
    }
  }

  /** @param {string} name */
  updateResponder(name) {
    if (!name) name = "none";
    const constructor = allResponders.find((c) => c.name == name);
    this.children[0].remove();
    this.addChild(new constructor());
  }

  /** @param {Event & { access: Object }} event */
  respond(event) {
    console.log(this.constructor.name, this.children.length);
    this.children[0].respond(event);
  }
}
TreeBase.register(HandlerResponse);
