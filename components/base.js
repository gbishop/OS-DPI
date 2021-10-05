import { html, render } from "uhtml";
import { styleString } from "./style";

export class BaseComponent {
  /** @type {Object} */
  static defaultProps = { scale: 1, background: "" };

  /**
   * @param {Object} props
   * @param {Object} context
   * @param {BaseComponent} parent
   */
  constructor(props, context, parent = null) {
    // the props will be initialized with the base defaults, followed by the
    // derived defaults, followed by the supplied props
    this.props = {
      ...BaseComponent.defaultProps,
      // @ts-ignore: undefined property
      ...this.constructor.defaultProps,
      ...props,
    };
    this.context = context;
    this.children = [];
    this.parent = parent;
    this.current = null;
    this.init();
  }

  init() {}

  /**
   * Return the content for element.
   * @returns {import('uhtml').Hole | void }
   */
  template() {}

  render() {
    if (this.current) {
      const temp = this.template();
      if (temp) {
        render(this.current, temp);
      }
    }
  }
}

/** Map names to constructors */
export const ComponentMap = {};

class PageComponent extends BaseComponent {
  defaultProps = {};

  template() {
    return html`${this.children.map((child) => child.template())}`;
  }
}
ComponentMap["page"] = PageComponent;

class StackComponent extends BaseComponent {
  defaultProps = { ...super.defaultProps, direction: "row" };
  template() {
    const style = styleString({
      flexGrow: this.props.scale,
      backgroundColor: this.props.background,
    });
    return html`<div
      class=${`stack flex ${this.props.direction}`}
      ref=${this}
      style=${style}
    >
      ${this.children.map((child) => child.template())}
    </div>`;
  }
}
ComponentMap["stack"] = StackComponent;
