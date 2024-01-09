import { ensureArray } from "../array";
import { LRUCache } from "./interface";

export class CombinedLRUCache<V = unknown, K extends string = string>
  implements LRUCache<V, K>
{
  private caches: LRUCache<V, K>[] = [];

  constructor(caches: LRUCache<V, K>[]) {
    for (let i = 0; i < caches.length; i++) {
      this.caches.push(caches[i]!);
    }
  }

  set(key: K, value: V): void {
    this.caches.forEach(cache => {
      cache.set(key, value);
    });
  }

  get(key: K): V | undefined {
    let i = 0;
    let result: V | undefined = undefined;

    while (i < this.caches.length) {
      const value = this.caches[i]?.get(key);
      if (value) {
        result = value;
        break;
      }
      i++;
    }

    if (result) {
      while (i >= 0) {
        this.caches[i]?.set(key, result);
        i--;
      }
    }

    return result;
  }

  has(key: K): boolean {
    return this.caches.some(cache => cache.has(key));
  }

  delete(key: K): void {
    this.caches.forEach(cache => {
      cache.delete(key);
    });
  }

  clear(): void {
    this.caches.forEach(cache => {
      cache.clear();
    });
  }
}

export function combineLRUCaches<K extends string = string, V = unknown>(
  caches: LRUCache<V, K>[],
): LRUCache<V, K>;
export function combineLRUCaches<K extends string = string, V = unknown>(
  ...caches: LRUCache<V, K>[]
): LRUCache<V, K>;
export function combineLRUCaches<K extends string = string, V = unknown>(
  ...arrayOrCaches: LRUCache<V, K>[] | LRUCache<V, K>[][]
): LRUCache<V, K> {
  return new CombinedLRUCache(ensureArray(arrayOrCaches.flat(1)));
}
