// hacked up declaration, I don't know what I'm doing.
//
declare module "angular-expressions" {
  type ExpressionEvaluator = {
    (context: Object): any;
    ast: Object;
  };

  export function compile(code: string): ExpressionEvaluator;
}
