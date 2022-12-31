/**
 * A hack to generate a skeleton of the Wiki pages for our components
 */

import { TreeBase } from "components/treebase";

export function generateWikiSkeleton() {
  const result = {};
  // step through the registry to list each component
  for (const [name, constructor] of TreeBase.nameToClass) {
    const component = TreeBase.create(constructor);
    const props = Object.fromEntries(
      Object.entries(component.propsAsProps).map(([name, prop]) => [
        name,
        prop.constructor.name,
      ])
    );
    const children = component.allowedChildren;
    result[name] = {
      props,
      children,
    };
  }
  return JSON.stringify(result);
}

console.log(generateWikiSkeleton());
