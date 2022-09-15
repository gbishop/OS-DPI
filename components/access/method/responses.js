import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "../../treebase";
import Globals from "../../../globals";
import { Select, TypeSelect } from "../../props";
import { Method } from "./index";

const ResponderTypeMap = new Map([
  ["Responder", "none"],
  ["ResponderNext", "next"],
  ["ResponderActivate", "activate"],
  ["ResponderCue", "cue"],
  ["ResponderClearCue", "clear cue"],
  ["ResponderEmit", "emit"],
  ["ResponderStartTimer", "start timer"],
]);

export class HandlerResponse extends TreeBaseSwitchable {
  static title = "none";

  Response = new TypeSelect(ResponderTypeMap, { hiddenLabel: true });

  /** @param {Event & { access: Object }} event */
  respond(event) {
    console.log("no response for", event);
  }

  template() {
    return html`
      <div class="Response">
        ${this.Response.input()} ${this.subTemplate()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }

  subTemplate() {
    return html``;
  }
}

class ResponderNext extends HandlerResponse {
  static title = "next";

  respond() {
    Globals.pattern.next();
  }
}
TreeBase.register(ResponderNext);

class ResponderActivate extends HandlerResponse {
  static title = "activate";

  respond() {
    Globals.pattern.activate();
  }
}
TreeBase.register(ResponderActivate);

class ResponderCue extends HandlerResponse {
  static title = "cue";

  /** @param {Event & { access: Object }} event */
  respond(event) {
    Globals.pattern.setCurrent(event.target);
    Globals.pattern.cue();
  }
}
TreeBase.register(ResponderCue);

class ResponderClearCue extends HandlerResponse {
  static title = "clear cue";

  respond() {
    Globals.pattern.clearCue();
  }
}
TreeBase.register(ResponderClearCue);

class ResponderEmit extends HandlerResponse {
  static title = "emit";

  respond({ access }) {
    Globals.rules.applyRules(access.type, "press", access);
  }
}
TreeBase.register(ResponderEmit);

class ResponderStartTimer extends HandlerResponse {
  static title = "start timer";

  TimerName = new Select([], {
    placeholder: "Choose a timer",
    hiddenLabel: true,
  });

  subTemplate() {
    const timerNames = this.nearestParent(Method).timerNames;
    return html`${this.TimerName.input(timerNames)}`;
  }

  respond({ access }) {
    const timer = this.nearestParent(Method).timer(this.TimerName.value);
    if (!timer) return;
    timer.start(access);
  }
}
TreeBase.register(ResponderStartTimer);
