export type TFunction<T = any> = (...args: any[]) => T;

export type FallbackReturnType<T, Fallback = undefined> = T extends TFunction
  ? ReturnType<T>
  : Fallback;
