import { IndependentType, Type } from "~/utils/class";

const container = new Map();

export type InjectionToken<T> = {
  __injectionToken: "INJECTION_TOKEN";
  name: string;
  type: T;
};

export function register<T>(
  token: InjectionToken<T> | Type<T> | string,
  value: T,
): T {
  const key = typeof token === "string" ? token : token.name;
  container.set(key, value);

  return value;
}

export function unregister<T>(token: Type<T> | string): void {
  const key = typeof token === "string" ? token : token.name;
  container.delete(key);
}

export function resolve<T>(cls: IndependentType<T>): T {
  if (container.has(cls.name)) {
    return container.get(cls.name) as T;
  }

  const instance = new cls();
  container.set(cls.name, instance);
  return instance;
}

export function inject<T>(token: InjectionToken<T> | Type<T> | string): T {
  const key = typeof token === "string" ? token : token.name;
  if (!container.has(key)) {
    throw new Error(`No ${key} registered`);
  }
  return container.get(key);
}

export function createInjectionToken<T>(key: string): InjectionToken<T> {
  return {
    __injectionToken: "INJECTION_TOKEN",
    name: key,
  } as InjectionToken<T>;
}
