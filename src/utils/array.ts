export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export type Comparator<T> = (a: T, b: T) => number;
export function combineSorters<T>(...predicates: Comparator<T>[]) {
  if (predicates.length === 0) {
    return () => 0;
  }

  if (predicates.length === 1) {
    return predicates[0];
  }

  const combine = (index: number) => {
    if (index === predicates.length - 1) {
      return predicates[index]!;
    }
    return (a: T, b: T): number => {
      const result = predicates[index]!(a, b);
      if (result !== 0) {
        return result;
      }
      return combine(index + 1)(a, b);
    };
  };

  return combine(0);
}
