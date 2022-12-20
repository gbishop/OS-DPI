import { html } from "uhtml";
import { TreeBase } from "components/treebase";
import Globals from "app/globals";
import * as Props from "components/props";
import { Method, HandlerResponse } from "./index";
import { cueTarget } from "../pattern";

class ResponderNext extends HandlerResponse {
  respond() {
    this.pattern.next();
  }
}
TreeBase.register(ResponderNext, "ResponderNext");

class ResponderActivate extends HandlerResponse {
  /** @param {Event} event */
  respond(event) {
    if (this.pattern.cued) {
      this.pattern.activate();
    } else if (
      (event instanceof PointerEvent || event.type == "timer") &&
      event.target instanceof HTMLButtonElement
    ) {
      const button = event.target;
      const name = button.dataset.ComponentName;
      if ("onClick" in button.dataset) {
        console.log("wanted to call onclick");
      } else {
        Globals.actions.applyRules(name, "press", button.dataset);
      }
    }
  }
}
TreeBase.register(ResponderActivate, "ResponderActivate");

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
      const button = event.target;
      cueTarget(button, this.Cue.value);
    }
  }
}
TreeBase.register(ResponderCue, "ResponderCue");

class ResponderClearCue extends HandlerResponse {
  respond() {
    for (const element of document.querySelectorAll("[cue]")) {
      element.removeAttribute("cue");
    }
  }
}
TreeBase.register(ResponderClearCue, "ResponderClearCue");

class ResponderEmit extends HandlerResponse {
  /** @param {Event & { access: Object }} event */
  respond(event) {
    Globals.actions.applyRules(event.access.type, "press", event.access);
  }
}
TreeBase.register(ResponderEmit, "ResponderEmit");

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
TreeBase.register(ResponderStartTimer, "ResponderStartTimer");
