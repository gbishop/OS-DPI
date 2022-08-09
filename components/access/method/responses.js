import { html } from "uhtml";
import { TreeBase } from "../../treebase";
import Globals from "../../../globals";
import { Select } from "../../props";
import { Method } from "./index";

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
    TimerName: new Select([], {
      placeholder: "Choose a timer",
      hiddenLabel: true,
    }),
  };

  template() {
    const timerNames = this.nearestParent(Method).timerNames;
    return html`${this.props.TimerName.input(timerNames)}`;
  }

  respond({ access }) {
    const timer = this.nearestParent(Method).timer(this.props.TimerName.value);
    if (!timer) return;
    timer.start(access);
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
  props = {
    Response: new Select(new Map(allResponders.map((c) => [c.name, c.title]))),
  };

  /** @type {Responder[]} */
  children = [];

  template() {
    /* This is a hack to allow switching the children from the parent, I need a better solution */
    if (!this.children.length) {
      console.log("add the none child");
      TreeBase.create(Responder, this);
    }
    const current = this.children[0];
    return html`
      <div class="Response">
        ${this.props.Response.input()} ${current.template()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }

  /** @param {TreeBase} start */
  onUpdate(start) {
    console.log("onUpdate", this.props.Response);
    if (start === this) {
      // event originated here
      this.updateResponder(this.props.Response.value);
    }
  }

  /** @param {string} name */
  updateResponder(name) {
    if (!name) name = "none";
    const constructor = allResponders.find((c) => c.name == name);
    if (this.children[0] instanceof constructor) return;
    this.children = [];
    TreeBase.create(constructor, this);
    console.log("updated", this);
  }

  /** @param {WrappedEvent} event */
  respond(event) {
    this.children.length && this.children[0].respond(event);
  }
}
TreeBase.register(HandlerResponse);
