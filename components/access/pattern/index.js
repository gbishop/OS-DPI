import { html } from "uhtml";
import "css/pattern.css";
import Globals from "app/globals";
import * as Props from "components/props";
import { TreeBase } from "components/treebase";
import { ButtonWrap } from "../index";
import defaultPatterns from "./defaultPatterns";
import { DesignerTabPanel } from "components/tabcontrol";
import { toggleIndicator } from "app/components/helpers";

/** @typedef {ReturnType<ButtonWrap<Node>>} Button */

/** @typedef {Button | Group} Target */

/**
 * Group is a collection of Buttons or Groups and associated properties such as
 * the label and cue.
 */
export class Group {
  /**
   * @param {Target[]} members
   * @param {Object} props
   */
  constructor(members, props) {
    /** @type {Target[]} */
    this.members = members;
    this.groupProps = props;
  }

  get length() {
    return this.members.length * +this.groupProps.Cycles;
  }

  /** @param {Number} index */
  member(index) {
    if (index < 0 || index >= this.length) {
      return undefined;
    } else {
      return this.members[index % this.members.length];
    }
  }

  cue() {
    // console.log("cue group", this.members);
    for (const member of this.members) {
      member.cue(this.groupProps.Cue);
    }
  }
}

class PatternBase extends TreeBase {
  /** @type {PatternBase[]} */
  children = [];

  /**
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return input;
  }
}

export class PatternList extends DesignerTabPanel {
  name = new Props.String("Patterns");
  allowDelete = false;

  allowedChildren = ["PatternManager"];
  /** @type {PatternManager[]} */
  children = [];

  static tableName = "pattern";
  static defaultValue = defaultPatterns;

  template() {
    return html`<div class="PatternList" id=${this.id}>
      ${this.unorderedChildren()}
    </div>`;
  }

  /**
   * @returns {PatternManager}
   */
  get activePattern() {
    return (
      this.children.find((child) => child.Active.value) || this.children[0]
    );
  }
}
TreeBase.register(PatternList, "PatternList");

export class PatternManager extends PatternBase {
  allowedChildren = ["PatternSelector", "PatternGroup"];

  /** @type {Group} */
  targets;
  /**
   * Stack keeps track of the nesting as we walk the tree
   *
   * @type {{ group: Group; index: number }[]}
   */
  stack = [];

  /**
   * @type {Boolean} - cue is active when true
   */
  cued = false;

  // props
  Cycles = new Props.Integer(2, { min: 1 });
  Cue = new Props.Select();
  Name = new Props.String("a pattern");
  Key = new Props.UID();
  Active = new Props.OneOfGroup(false, { name: "pattern-active" });

  // settings() {
  //   const { Cycles, Cue, Name } = this;
  //   return html`
  //     <fieldset class=${this.className}>
  //       <legend>${Name.value}</legend>
  //       ${Name.input()} ${Cycles.input()} ${Cue.input(Globals.cues.cueMap)}
  //       <details>
  //         <summary>Details</summary>
  //         ${this.orderedChildren()}
  //       </details>
  //     </fieldset>
  //   `;
  // }

  settingsSummary() {
    const { Name, Active } = this;
    return html`<h3>
      ${Name.value} ${toggleIndicator(Active.value, "Active")}
    </h3>`;
  }

  settingsDetails() {
    const { Cycles, Cue, Name, Active } = this;
    return html`
      <div>
        ${Name.input()} ${Active.input()} ${Cycles.input()}
        ${Cue.input(Globals.cues.cueMap)} ${this.orderedChildren()}
      </div>
    `;
  }

  settingsChildren() {
    return html`<!--empty-->`;
  }

  /**
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }

  /** Collect the nodes from the DOM and process them into targets */
  refresh() {
    // gather the buttons from the UI
    const buttons = [];
    for (const node of document.querySelectorAll("#UI button:not(:disabled)")) {
      buttons.push(ButtonWrap(node));
    }

    let members = [];
    if (this.children.length) {
      for (const child of this.children) {
        const r = child.apply(buttons);
        if (r.length > 0) {
          if (r instanceof Group) {
            members.push(r);
          } else {
            members = members.concat(r);
          }
        }
      }
    } else {
      members = buttons;
    }
    this.targets = new Group(members, this.props);
    this.stack = [{ group: this.targets, index: -1 }];
    this.cue();
    console.log("refresh", this);
  }

  /**
   * Current keeps track of the currently active node or group
   *
   * @type {Target}
   */
  get current() {
    const { group, index } = this.stack[0];
    return group.member(index);
  }

  next() {
    const top = this.stack[0];
    console.log("next", { top }, this);
    if (top.index < top.group.length - 1) {
      top.index++;
    } else if (this.stack.length > 1) {
      this.stack.shift();
      console.log("stack pop");
    } else if (this.stack.length == 1) {
      top.index = 0;
    } else {
      // stack is empty ignore
      console.log("empty stack?");
    }
    this.cue();
  }

  activate() {
    console.log("activate");
    let current = this.current;
    if (!current) return;
    if (current instanceof Group) {
      console.log("activate group", current, this.stack);
      while (current.length == 1 && current.members[0] instanceof Group) {
        current = current.members[0];
      }
      this.stack.unshift({ group: current, index: 0 });
      console.log("push stack", this.current, this.stack);
    } else {
      const name = current.access.ComponentName;
      console.log("activate button", current);
      if ("onClick" in current.access) {
        console.log("calling onClick");
        current.access.onClick();
      } else {
        console.log("applyRules", name, current.access);
        Globals.actions.applyRules(name, "press", current.access);
      }
    }
    this.cue();
  }

  clearCue() {
    this.cued = false;
    for (const element of document.querySelectorAll("[cue]")) {
      element.removeAttribute("cue");
    }
  }

  cue() {
    this.clearCue();
    const current = this.current;
    console.log("cue current", current);
    if (!current) return;
    this.cued = true;
    current.cue(this.Cue.value);
  }
}
PatternBase.register(PatternManager, "PatternManager");

export class PatternGroup extends PatternBase {
  // props
  Name = new Props.String("");
  Cycles = new Props.Integer(2, { min: 1 });
  Cue = new Props.Select();

  allowedChildren = ["PatternGroup", "PatternSelector"];

  settings() {
    const { Name, Cycles, Cue } = this;
    return html`<fieldset class=${this.className}>
      <legend>Group: ${Name.value}</legend>
      ${Name.input()} ${Cycles.input()} ${Cue.input(Globals.cues.cueMap)}
      ${this.orderedChildren()}
    </fieldset>`;
  }

  /**
   * Build a group from the output of the selectors applied to the input
   *
   * @param {Target[]} input
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }
}
PatternBase.register(PatternGroup, "PatternGroup");

class PatternSelector extends PatternBase {
  allowedChildren = ["Filter", "GroupBy", "OrderBy"];
  settings() {
    return html`<fieldset class=${this.className}>
      <legend>Selector</legend>
      ${this.unorderedChildren()}
    </fieldset>`;
  }

  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return this.children.reduce(
      (previous, operator) => operator.apply(previous),
      input
    );
  }
}
PatternBase.register(PatternSelector, "PatternSelector");

class Filter extends PatternBase {
  Filter = new Props.Expression();
  settings() {
    const { Filter } = this;
    return html`<div class=${this.className}>${Filter.input()}</div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      return input.filter((/** @type {Button} */ button) =>
        this.Filter.eval(button.access)
      );
    }
  }
}
PatternBase.register(Filter, "Filter");

// allow the sort to handle numbers reasonably
const comparator = new Intl.Collator(undefined, {
  numeric: true,
});

class OrderBy extends PatternBase {
  OrderBy = new Props.Field();
  settings() {
    const { OrderBy } = this;
    return html`<div class=${this.className}>${OrderBy.input()}</div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      const key = this.OrderBy.value.slice(1);
      return [.../** @type {Button[]} */ (input)].sort((a, b) =>
        comparator.compare(a.access[key], b.access[key])
      );
    }
  }
}
PatternBase.register(OrderBy, "OrderBy");

class GroupBy extends PatternBase {
  GroupBy = new Props.Field();
  Name = new Props.String("");
  Cue = new Props.Select();
  Cycles = new Props.Integer(2);
  settings() {
    const { GroupBy, Name, Cue, Cycles } = this;
    return html`<div class=${this.className}>
      ${GroupBy.input()} ${Name.input()} ${Cue.input(Globals.cues.cueMap)}
      ${Cycles.input()}
    </div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      const { GroupBy, ...props } = this.props;
      const key = GroupBy.slice(1);
      const result = [];
      const groupMap = new Map();
      for (const button of /** @type {Button[]} */ (input)) {
        let k = button.access[key];
        if (!k) continue;
        k = k.toString();
        // we got a key, check to see if we have a group
        let group = groupMap.get(k);
        if (!group) {
          // no group, create one and add it to the map and the result
          group = new Group([button], props);
          groupMap.set(k, group);
          result.push(group);
        } else {
          group.members.push(button);
        }
      }
      if (result.length === 1) {
        return result[0].members;
      }
      return result;
    }
  }
}
PatternBase.register(GroupBy, "GroupBy");
