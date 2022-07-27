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

console.log("in responses");

const allResponses = {
  next: () => Globals.pattern.next(),
  activate: () => Globals.pattern.activate(),
  emit: ({ type, access }) => { console.log('emit', {type, access}); Globals.rules.applyRules(type, "press", access)},
  /** @param {Event & { access: Object }} event */
  cue: (event) => {
    console.log("cue response", event);
    Globals.pattern.setCurrent(event.target);
    Globals.pattern.cue();
  },
  clearCue: () => {
    Globals.pattern.clearCue();
  },
};

export class HandlerResponse extends TreeBase {
  props = {
    Response: new Select(Object.keys(allResponses), { hiddenLabel: true }),
  };

  template() {
    const { Response } = this.props;
    return html`
      <div class="Response">
        ${Response.input()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }

  /** @param {Event & { access: Object }} event */
  respond(event) {
    const verb = this.props.Response.value;
    const func = allResponses[verb];
    console.log({ verb, func, event });
    if (func) func(event);
  }
}
TreeBase.register(HandlerResponse);
