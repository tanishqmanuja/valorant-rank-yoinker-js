export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface IndependentType<T> extends Function {
  new (): T;
}
