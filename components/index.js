import { ComponentMap } from "./base";
import "./grid";
import "./display";

export function assemble(design, context, parent = null) {
  console.log(design.type);
  const node = new ComponentMap[design.type](design.props, context, parent);
  node.children = design.children.map((child) =>
    assemble(child, context, node)
  );
  return node;
}
