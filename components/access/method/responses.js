import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "../../treebase";
import Globals from "../../../globals";
import { Select, TypeSelect } from "../../props";
import { Method } from "./index";

const ResponderTypeMap = new Map([
  ["HandlerResponse", "none"],
  ["ResponderNext", "next"],
  ["ResponderActivate", "activate"],
  ["ResponderCue", "cue"],
  ["ResponderClearCue", "clear cue"],
  ["ResponderEmit", "emit"],
  ["ResponderStartTimer", "start timer"],
]);

export class HandlerResponse extends TreeBaseSwitchable {
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

  get pattern() {
    const method = this.nearestParent(Method);
    return method.pattern;
  }

  subTemplate() {
    return html`<!--empty-->`;
  }
}
TreeBase.register(HandlerResponse);

class ResponderNext extends HandlerResponse {
  respond() {
    this.pattern.next();
  }
}
TreeBase.register(ResponderNext);

class ResponderActivate extends HandlerResponse {
  respond() {
    console.log("responder activate");
    this.pattern.activate();
  }
}
TreeBase.register(ResponderActivate);

class ResponderCue extends HandlerResponse {
  /** @param {Event & { access: Object }} event */
  respond(event) {
    this.pattern.setCurrent(event.target);
    this.pattern.cue();
  }
}
TreeBase.register(ResponderCue);

class ResponderClearCue extends HandlerResponse {
  respond() {
    this.pattern.clearCue();
  }
}
TreeBase.register(ResponderClearCue);

class ResponderEmit extends HandlerResponse {
  respond({ access }) {
    Globals.rules.applyRules(access.type, "press", access);
  }
}
TreeBase.register(ResponderEmit);

class ResponderStartTimer extends HandlerResponse {
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
    // hand the interval to Cue CSS for animations
    document.documentElement.style.setProperty(
      "--timerInterval",
      `${timer.Interval.value}s`
    );
    timer.start(access);
  }
}
TreeBase.register(ResponderStartTimer);
