import { TreeBase } from "components/treebase";
import Globals from "app/globals";
import * as Props from "components/props";
import { Method, HandlerResponse } from "./index";
import { cueTarget, clearCues } from "../pattern";

class ResponderNext extends HandlerResponse {
  respond() {
    Globals.patterns.activePattern.next();
  }
}
TreeBase.register(ResponderNext, "ResponderNext");

class ResponderActivate extends HandlerResponse {
  /** @param {Event} event */
  respond(event) {
    if (Globals.patterns.activePattern.cued) {
      Globals.patterns.activePattern.activate();
    } else if (
      (event instanceof PointerEvent || event.type == "timer") &&
      event.target instanceof HTMLButtonElement
    ) {
      const button = event.target;
      const name = button.dataset.ComponentName;
      if (button.hasAttribute("click")) {
        button.click();
      } else if (name) {
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
      clearCues();
      const button = event.target;
      cueTarget(button, this.Cue.value);
    }
  }
}
TreeBase.register(ResponderCue, "ResponderCue");

class ResponderClearCue extends HandlerResponse {
  respond() {
    clearCues();
  }
}
TreeBase.register(ResponderClearCue, "ResponderClearCue");

class ResponderEmit extends HandlerResponse {
  /** @param {Event & { access: Object }} event */
  respond(event) {
    const method = this.nearestParent(Method);
    if (!method) return;
    Globals.actions.applyRules(method.Name.value, "press", event.access);
  }
}
TreeBase.register(ResponderEmit, "ResponderEmit");

class ResponderStartTimer extends HandlerResponse {
  TimerName = new Props.Select([], {
    placeholder: "Choose a timer",
    hiddenLabel: true,
  });

  subTemplate() {
    const timerNames = this.nearestParent(Method)?.timerNames;
    return this.TimerName.input(timerNames);
  }

  /** @param {Event & { access: Object }} event */
  respond(event) {
    const timer = this.nearestParent(Method)?.timer(this.TimerName.value);
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
