import { TreeBase } from "components/treebase";
import Globals from "app/globals";
import * as Props from "components/props";
import { Method, HandlerResponse } from "./index";
import { cueTarget, clearCues } from "../pattern";

class ResponderNext extends HandlerResponse {
  respond() {
    const method = this.nearestParent(Method);
    if (!method) return;
    method.pattern.next();
  }
}
TreeBase.register(ResponderNext, "ResponderNext");

class ResponderActivate extends HandlerResponse {
  /** @param {EventLike} event */
  respond(event) {
    const method = this.nearestParent(Method);
    if (!method) return;
    method.pattern.activate(event);
  }
}
TreeBase.register(ResponderActivate, "ResponderActivate");

class ResponderCue extends HandlerResponse {
  Cue = new Props.Cue();

  subTemplate() {
    return this.Cue.input();
  }

  /** @param {EventLike} event */
  respond(event) {
    //    console.log("cue", event);
    cueTarget(event.target, this.Cue.value);
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
  /** @param {EventLike} event */
  respond(event) {
    const method = this.nearestParent(Method);
    if (!method) return;
    Globals.actions.applyRules(method.Name.value, "press", event.access);
  }
}
TreeBase.register(ResponderEmit, "ResponderEmit");

class ResponderStartTimer extends HandlerResponse {
  TimerName = new Props.Select(() => this.nearestParent(Method).timerNames, {
    placeholder: "Choose a timer",
    hiddenLabel: true,
  });

  subTemplate() {
    return this.TimerName.input();
  }

  /** @param {EventLike} event */
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
