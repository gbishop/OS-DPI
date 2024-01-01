declare module "introspected" {
  export default function Introspected<Type>(
    source: Type,
    callback: (root: Type, path: string) => void
  ): Type;
}
