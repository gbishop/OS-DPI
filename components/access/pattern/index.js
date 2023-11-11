import { html } from "uhtml";
import "css/pattern.css";
import Globals from "app/globals";
import * as Props from "components/props";
import { TreeBase } from "components/treebase";
import defaultPatterns from "./defaultPatterns";
import { DesignerPanel } from "components/designer";
import { toggleIndicator } from "app/components/helpers";

// only run one animation at a time
let animationNonce = 0;

/** @param {Target} target
 * @param {string} defaultValue */
export function cueTarget(target, defaultValue) {
  if (target instanceof HTMLButtonElement) {
    target.setAttribute("cue", defaultValue);
    const video = target.querySelector("video");
    if (video && !video.hasAttribute("autoplay")) {
      if (video.hasAttribute("muted")) video.muted = true;
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {})
          .catch((error) => {
            console.log("autoplay prevented", error);
          });
      }
    }
  } else if (target instanceof Group) {
    target.cue();
  }
}

export function clearCues() {
  for (const element of document.querySelectorAll("[cue]")) {
    element.removeAttribute("cue");
    const video = element.querySelector("video");
    if (video && !video.hasAttribute("autoplay")) {
      video.pause();
      video.currentTime = 0;
    }
  }
}

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
    this.access = props;
  }

  get length() {
    return this.members.length * +this.access.Cycles;
  }

  /** @param {Number} index */
  member(index) {
    if (index < 0 || index >= this.length) {
      return undefined;
    } else {
      return this.members[index % this.members.length];
    }
  }

  /** @param {string} value */
  cue(value = "") {
    if (!value) {
      value = this.access.Cue;
    }
    //    console.log("cue group", this);
    for (const member of this.members) {
      if (member instanceof HTMLButtonElement) cueTarget(member, value);
      else if (member instanceof Group) member.cue(value);
    }
  }

  /** Test if this group contains a button return the top-level index if so, -1 if not
   * @param {HTMLButtonElement} button
   * @returns {number}
   */
  contains(button) {
    for (let i = 0; i < this.members.length; i++) {
      const member = this.members[i];
      if (
        member === button ||
        (member instanceof Group && member.contains(button) >= 0)
      )
        return i;
    }
    return -1;
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

export class PatternList extends DesignerPanel {
  name = new Props.String("Patterns");
  allowDelete = false;

  allowedChildren = ["PatternManager"];
  /** @type {PatternManager[]} */
  children = [];

  static tableName = "pattern";
  static defaultValue = defaultPatterns;

  settings() {
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

  get patternMap() {
    /** @type {[string,string][]} */
    const entries = this.children.map((child) => [
      child.Key.value,
      child.Name.value,
    ]);
    entries.unshift(["DefaultPattern", "Default Pattern"]);
    entries.unshift(["NullPattern", "No Pattern"]);
    return new Map(entries);
  }

  /**
   * return the pattern given its key
   * @param {string} key
   */
  patternFromKey(key) {
    let result;
    if (key === "NullPattern") {
      return nullPatternManager;
    }
    result = this.children.find((pattern) => pattern.Key.value == key);
    if (!result) {
      result = this.activePattern;
    }
    return result;
  }
}
TreeBase.register(PatternList, "PatternList");

export class PatternManager extends PatternBase {
  allowedChildren = ["PatternSelector", "PatternGroup"];

  /** @type {Group} */
  targets = new Group([], {});
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
  Cue = new Props.Cue({ defaultValue: "DefaultCue" });
  Name = new Props.String("a pattern");
  Key = new Props.UID();
  Active = new Props.OneOfGroup(false, {
    name: "pattern-active",
    label: "Default",
  });

  settingsSummary() {
    const { Name, Active } = this;
    return html`<h3>
      ${Name.value} ${toggleIndicator(Active.value, "Active")}
    </h3>`;
  }

  settingsDetails() {
    const { Cue, Name, Active } = this;
    return html`
      <div>
        ${Name.input()} ${Active.input()} ${Cue.input()}
        <button
          onclick=${() => {
            this.animate();
          }}
        >
          Animate
        </button>
        ${this.orderedChildren()}
      </div>
    `;
  }

  settingsChildren() {
    return this.empty;
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
    for (const node of /** @type {NodeListOf<HTMLButtonElement>} */ (
      document.querySelectorAll("#UI button:not(:disabled)")
    )) {
      buttons.push(node);
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
    this.targets = new Group(members, { ...this.props, Cycles: 1 });
    // console.log("refresh", this.targets);
    this.stack = [{ group: this.targets, index: -1 }];
    this.cue();

    // stop any running animations
    animationNonce += 1;
  }

  /**
   * Current keeps track of the currently active node or group
   *
   * @type {Target | undefined}
   */
  get current() {
    const { group, index } = this.stack[0];
    return group.member(index);
  }

  next() {
    const top = this.stack[0];
    // console.log("next", { top }, this);
    if (top.index < top.group.length - 1) {
      top.index++;
    } else if (this.stack.length > 1) {
      this.stack.shift();
      // console.log("stack pop");
    } else if (this.stack.length == 1) {
      top.index = 0;
    } else {
      // stack is empty ignore
      // console.log("empty stack?");
    }
    this.cue();
  }

  /** @param {EventLike} event */
  activate(event) {
    const target = event.target;
    // console.log("activate", event);
    if (target) {
      // adjust the stack to accomodate the target
      for (;;) {
        const top = this.stack[0];
        const newIndex = top.group.members.indexOf(target);
        if (newIndex >= 0) {
          top.index = newIndex;
          // console.log("set index", top.index);
          break;
        }
        if (this.stack.length == 1) {
          top.index = 0;
          // console.log("not found");
          break;
        } else {
          this.stack.shift();
          // console.log("pop stack");
        }
      }
    }
    //    console.log("stack", this.stack);
    let current = this.current;
    if (!current) return;
    if (current instanceof Group) {
      // console.log("activate group", current, this.stack);
      while (current.length == 1 && current.members[0] instanceof Group) {
        current = current.members[0];
      }
      // I need to work out the index here. Should be the group under the pointer
      this.stack.unshift({ group: current, index: event?.groupIndex || 0 });
      // console.log("push stack", this.current, this.stack);
    } else if (current instanceof HTMLButtonElement) {
      if (current.hasAttribute("click")) {
        current.click();
      } else {
        const name = current.dataset.ComponentName;
        // console.log("activate button", current);
        // console.log("applyRules", name, current.access);
        Globals.actions.applyRules(name || "", "press", current.dataset);
      }
    }
    this.cue();
  }

  clearCue() {
    this.cued = false;
    clearCues();
  }

  cue() {
    this.clearCue();
    const current = this.current;
    //    console.log("cue current", current);
    if (!current) return;
    this.cued = true;
    cueTarget(current, this.Cue.value);
  }

  /** Return the access info for current
   */
  getCurrentAccess() {
    const current = this.current;
    if (!current) return {};
    if (current instanceof HTMLButtonElement) {
      return current.dataset;
    } else if (current instanceof Group) {
      return { ...current.access };
    }
    return {};
  }

  /** Map the event target to a group
   * @param {EventLike} event
   * @returns {EventLike}
   */
  remapEventTarget(event) {
    event = {
      type: event.type,
      target: event.target,
      timeStamp: event.timeStamp,
    };
    if (event.target instanceof HTMLButtonElement) {
      event.access = event.target.dataset;
    }
    if (!event.target) return event;
    // console.log("ret", this.stack);
    event.originalTarget = event.target;
    for (let level = 0; level < this.stack.length; level++) {
      const group = this.stack[level].group;
      const members = group.members;
      // first scan to see if the element is top level in this group
      let index = members.indexOf(event.target);
      if (index >= 0) {
        if (level === 0) {
          // console.log("A", event);
          return event;
        } else {
          // console.log("B", index);
          return {
            ...event,
            target: group,
            groupIndex: index,
            access: { ...event.access, ...group.access },
          };
        }
      } else if (event.target instanceof HTMLButtonElement) {
        // otherwise check to see if any group members contain it
        for (index = 0; index < members.length; index++) {
          const member = members[index];
          if (member instanceof Group) {
            let i = member.contains(event.target);
            if (i >= 0) {
              // console.log("C", i);
              return {
                ...event,
                target: member,
                groupIndex: i,
                access: { ...event.access, ...member.access },
              };
            }
          }
        }
      }
    }
    return event;
  }

  async animate() {
    /** @param {Group} group
     * @param {string} cue
     */
    function* animateGroup(group, cue) {
      const cycles = +group.access.Cycles;
      const groupTime = 500;
      const buttonTime = Math.max(
        100,
        Math.min(500, 600 / group.members.length),
      );
      for (let cycle = 0; cycle < cycles; cycle++) {
        for (const member of group.members) {
          cueTarget(member, cue);
          yield new Promise((resolve) =>
            setTimeout(
              resolve,
              member instanceof Group ? groupTime : buttonTime,
            ),
          );
          clearCues();
          if (member instanceof Group) {
            yield* animateGroup(member, cue);
          }
        }
      }
    }
    this.clearCue();
    this.refresh();

    // kill any running animations and save the new value
    let nonce = ++animationNonce;

    for (const promise of animateGroup(this.targets, this.Cue.value)) {
      await promise;
      // quit if the animationNonce changes
      if (nonce !== animationNonce) return;
    }
  }
}
PatternBase.register(PatternManager, "PatternManager");

const nullPatternManager = TreeBase.create(PatternManager);

export class PatternGroup extends PatternBase {
  // props
  Name = new Props.String("");
  Cycles = new Props.Integer(2, { min: 1 });
  Cue = new Props.Cue({ defaultValue: "DefaultCue" });

  allowedChildren = ["PatternGroup", "PatternSelector"];

  settings() {
    const { Name, Cycles, Cue } = this;
    return html`<fieldset class=${this.className} tabindex="0" id=${this.id}>
      <legend>Group: ${Name.value}</legend>
      ${Name.input()} ${Cycles.input()} ${Cue.input()} ${this.orderedChildren()}
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
    return html`<fieldset class=${this.className} tabindex="0" id=${this.id}>
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
      input,
    );
  }
}
PatternBase.register(PatternSelector, "PatternSelector");

class Filter extends PatternBase {
  Filter = new Props.Expression();
  settings() {
    const { Filter } = this;
    return html`<div class=${this.className} tabindex="0" id=${this.id}>
      ${Filter.input()}
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
            new Group(this.apply(group.members), group.access),
        )
        .filter((target) => target.length > 0);
    } else {
      return input.filter((/** @type {HTMLButtonElement} */ button) =>
        this.Filter.eval(button.dataset),
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
    return html`<div class=${this.className} tabindex="0" id=${this.id}>
      ${OrderBy.input()}
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
            new Group(this.apply(group.members), group.access),
        )
        .filter((target) => target.length > 0);
    } else {
      const key = this.OrderBy.value.slice(1);
      return [.../** @type {HTMLButtonElement[]} */ (input)].sort((a, b) =>
        comparator.compare(a.dataset[key] || "", b.dataset[key] || ""),
      );
    }
  }
}
PatternBase.register(OrderBy, "OrderBy");

class GroupBy extends PatternBase {
  GroupBy = new Props.Field();
  Name = new Props.String("");
  Cue = new Props.Cue({ defaultValue: "DefaultCue" });
  Cycles = new Props.Integer(2);
  settings() {
    const { GroupBy, Name, Cue, Cycles } = this;
    const fields = Props.toMap([
      ...new Set([
        ...Globals.data.allFields,
        "#ComponentName",
        "#row",
        "#column",
      ]),
    ]);
    return html`<div class=${this.className} tabindex="0" id=${this.id}>
      ${GroupBy.input(fields)} ${Name.input()} ${Cue.input()} ${Cycles.input()}
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
            new Group(this.apply(group.members), group.access),
        )
        .filter((target) => target.length > 0);
    } else {
      const { GroupBy, Name, ...props } = this.props;
      const key = GroupBy.slice(1);
      const result = [];
      const groupMap = new Map();
      for (const button of /** @type {HTMLButtonElement[]} */ (input)) {
        let k = button.dataset[key] || "";
        // if (!k) continue;
        k = k.toString();
        // we got a key, check to see if we have a group
        let group = groupMap.get(k);
        if (!group) {
          // no group, create one and add it to the map and the result
          group = new Group([button], {
            GroupName: Name.replace(GroupBy, k),
            [key]: k,
            ...props,
          });
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
