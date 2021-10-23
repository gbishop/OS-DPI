declare module "uhooks";
export function hooked(func: Function): Function;
export function useRef<T>(thing: T): { current: T };
export function useState<T>(
  thing: T
): [thing: T, (newThing: T | ((newThing: T) => T)) => void];
