export type MaybePromise<T> = T | Promise<T>;

export function isFulfilled<T>(
  item: PromiseSettledResult<T>,
): item is PromiseFulfilledResult<T> {
  return item.status === "fulfilled";
}

export function isRejected<T>(
  item: PromiseSettledResult<T>,
): item is PromiseRejectedResult {
  return item.status === "rejected";
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function tryCatch<T>(tryFn: () => T, catchFn?: (e: unknown) => any): T {
  try {
    return tryFn();
  } catch (e) {
    if (catchFn) {
      return catchFn(e);
    } else {
      throw e;
    }
  }
}
