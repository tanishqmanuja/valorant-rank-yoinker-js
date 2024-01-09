import { RetryConfig, defer, firstValueFrom, from, retry } from "rxjs";

export function retryPromise<T>(
  promise: Promise<T>,
  retryConfig?: RetryConfig,
) {
  const observable = defer(() =>
    from(promise).pipe(retry({ count: 2, delay: 2000, ...retryConfig })),
  );
  return firstValueFrom(observable);
}
