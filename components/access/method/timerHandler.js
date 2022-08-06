import { TreeBase } from "../../treebase";
import { Handler, HandlerCondition } from "./handler";
import { HandlerResponse } from "./responses";
import { Select } from "../../props";
import { html } from "uhtml";
import {
  Subject,
  Observable,
  switchMap,
  delay,
  takeUntil,
  of,
  EMPTY,
  tap,
} from "rxjs";
import { ButtonWrap, EventWrap } from "../index";
import { Method } from "./index";

const timerSignals = new Map([
  ["transitionend", "Transition end"],
  ["timer", "Timer complete"],
]);

export class TimerHandler extends Handler {
  props = {
    Signal: new Select(timerSignals),
    TimerName: new Select([], { hiddenLabel: true }),
  };

  template() {
    const { conditions, responses } = this;
    const { Signal } = this.props;
    const timers = new Map(
      this.nearestParent(Method).timers.map((timer) => [
        timer.props.Key.value,
        timer.props.Name.value,
      ])
    );
    return html`
      <fieldset class="Handler">
        <legend>Timer Handler</legend>
        ${Signal.input()} ${this.props.TimerName.input(timers)}
        ${this.deleteButton({ title: "Delete this handler" })}
        <fieldset class="Conditions">
          <legend>
            Conditions
            ${this.addChildButton("+", HandlerCondition, {
              title: "Add a condition",
            })}
          </legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>
            Responses
            ${this.addChildButton("+", HandlerResponse, {
              title: "Add a response",
            })}
          </legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {Subject} stop$ */
  configure(stop$) {
    const timer = this.nearestParent(Method).timers.find(
      (timer) => timer.props.Key.value == this.props.TimerName.value
    );
    if (!timer) return;
    const delayTime = 1000 * timer.props.Interval.valueAsNumber;
    timer.subject$
      .pipe(
        switchMap((event) =>
          event.type == "cancel" ? EMPTY : of(event).pipe(delay(delayTime))
        ),
        takeUntil(stop$)
      )
      .subscribe((e) => this.respond(e));
  }
}
TreeBase.register(TimerHandler);
