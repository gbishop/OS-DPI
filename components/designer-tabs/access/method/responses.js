import { html } from "uhtml";
import { TreeBase, TreeBaseSwitchable } from "../../../treebase";
import Globals from "../../../../globals";
import * as Props from "../../../props";
import { Method } from "./index";
import { ButtonWrap } from "../index";

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

class ResponderPatternNext extends HandlerResponse {
  respond() {
    this.pattern.next();
  }
}
TreeBase.register(ResponderPatternNext);

class ResponderPatternActivate extends HandlerResponse {
  respond() {
    console.log("responder activate");
    this.pattern.activate();
  }
}
TreeBase.register(ResponderPatternActivate);

class ResponderPatternCue extends HandlerResponse {
  respond() {
    this.pattern.cue();
  }
}
TreeBase.register(ResponderPatternCue);

class ResponderCue extends HandlerResponse {
  Cue = new Props.Select();

  subTemplate() {
    return this.Cue.input(Globals.cues.cueMap);
  }

  /** @param {Event & { access: Object }} event */
  respond(event) {
    if (event.target instanceof HTMLButtonElement) {
      for (const element of document.querySelectorAll("[cue]")) {
        element.removeAttribute("cue");
      }
      const button = ButtonWrap(event.target);
      button.cue(this.Cue.value);
    }
  }
}
TreeBase.register(ResponderCue);

class ResponderActivate extends HandlerResponse {
  /** @param {Event & { access: Object }} event */
  respond(event) {
    if (event.target instanceof HTMLButtonElement) {
      const button = ButtonWrap(event.target);
      const name = button.access.ComponentName;
      if ("onClick" in button.access) {
        button.access.onClick();
      } else {
        Globals.actions.applyRules(name, "press", button.access);
      }
    }
  }
}
TreeBase.register(ResponderActivate);

class ResponderClearCue extends HandlerResponse {
  respond() {
    for (const element of document.querySelectorAll("[cue]")) {
      element.removeAttribute("cue");
    }
  }
}
TreeBase.register(ResponderClearCue);

class ResponderEmit extends HandlerResponse {
  /** @param {Event & { access: Object }} event */
  respond(event) {
    Globals.actions.applyRules(event.access.type, "press", event.access);
  }
}
TreeBase.register(ResponderEmit);

class ResponderStartTimer extends HandlerResponse {
  TimerName = new Props.Select([], {
    placeholder: "Choose a timer",
    hiddenLabel: true,
  });

  subTemplate() {
    const timerNames = this.nearestParent(Method).timerNames;
    return html`${this.TimerName.input(timerNames)}`;
  }

  /** @param {Event & { access: Object }} event */
  respond(event) {
    const timer = this.nearestParent(Method).timer(this.TimerName.value);
    if (!timer) return;
    // hand the interval to Cue CSS for animations
    document.documentElement.style.setProperty(
      "--timerInterval",
      `${timer.Interval.value}s`
    );
    timer.start(event);
  }
}
TreeBase.register(ResponderStartTimer);
