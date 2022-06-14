import { html } from "uhtml";
import { Base } from "./base";
import { TreeBase } from "./treebase";
import { Select, Expression, String, Integer } from "./props";
import Globals from "../globals";
import db from "../db";

export class AccessMethod extends Base {
  template() {
    return html`<div class="access-method treebase">
      ${Globals.method.template()}
    </div>`;
  }
}

export class MethodChooser extends TreeBase {
  props = {
    currentIndex: new Integer(),
  };
  /** @type {Method} */
  currentMethod = null;

  /** @type {Method[]} */
  children = [];

  update() {
    db.write("method", this.toObject());
    Globals.state.update();
  }

  template() {
    /** @type {string[]} */
    const choices = this.children.map((child) => child.Props.Name.value);
    console.log({ choices });
    const { currentIndex } = this.Props;
    if (currentIndex.value >= 0 && currentIndex.value < choices.length) {
      this.currentMethod = this.children[currentIndex.value];
    } else if (choices.length > 0) {
      currentIndex.value = choices.length - 1;
      this.currentMethod = this.children[currentIndex.value];
    }
    return html`<div class="MethodChooser" onChange=${() => this.update()}>
      <label
        >Access Method
        <select
          onChange=${(/** @type {{ target: { value: string; }; }} */ e) => {
            currentIndex.value = parseInt(e.target.value);
            this.currentMethod = this.children[currentIndex.value];
          }}
        >
          ${choices.map(
            (label, index) =>
              html`<option
                value=${index}
                ?selected=${currentIndex.value == index}
              >
                ${label}
              </option>`
          )}
        </select></label
      >
      ${this.addChildButton("+Method", Method, {
        title: "Create a new access method",
        onClick: () => currentIndex.set(this.children.length - 1),
      })}
      ${this.currentMethod ? this.currentMethod.template() : html``}
    </div> `;
  }
}
TreeBase.register(MethodChooser);

class Method extends TreeBase {
  props = {
    Name: new String("New method"),
  };

  /** @type {Handler[]} */
  children = [];

  template() {
    const { Name } = this.Props;
    return html`<fieldset class="Method">
      <legend>${Name.value}</legend>
      ${Name.input()}
      ${this.addChildButton("+Handler", Handler, { title: "Add a handler" })}
      ${this.orderedChildren()}
    </fieldset>`;
  }
}
TreeBase.register(Method);

const allSignals = ["keyup", "keydown"];

class Handler extends TreeBase {
  props = {
    Signal: new Select(allSignals),
  };
  /** @type {(HandlerCondition|HandlerResponse)[]} */
  children = [];

  get conditions() {
    return /** @type {HandlerCondition[]} */ (
      this.children.filter((child) => child instanceof HandlerCondition)
    );
  }

  get responses() {
    return /** @type {HandlerCondition[]} */ (
      this.children.filter((child) => child instanceof HandlerResponse)
    );
  }

  template() {
    const { conditions, responses } = this;
    const { Signal } = this.Props;
    return html`
      <fieldset class="Handler">
        <legend>Handler</legend>
        ${Signal.input()} ${this.deleteButton({ title: "Delete this handler" })}
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
}
TreeBase.register(Handler);

class HandlerCondition extends TreeBase {
  props = {
    Condition: new Expression("", { hiddenLabel: true }),
  };

  template() {
    const { Condition } = this.Props;
    return html`
      <div class="Condition">
        ${Condition.input()}
        ${this.deleteButton({ title: "Delete this condition" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerCondition);

const allResponses = {
  next: () => Globals.pattern.next(),
  activate: () => Globals.pattern.activate(),
};

class HandlerResponse extends TreeBase {
  props = {
    Response: new Select(Object.keys(allResponses), { hiddenLabel: true }),
  };

  template() {
    const { Response } = this.Props;
    return html`
      <div class="Condition">
        ${Response.input()}
        ${this.deleteButton({ title: "Delete this response" })}
      </div>
    `;
  }
}
TreeBase.register(HandlerResponse);
