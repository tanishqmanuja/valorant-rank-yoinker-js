import { LRUCache } from "./interface";

export class InMemoryLRUCache<V = unknown, K extends string = string>
  implements LRUCache<V, K>
{
  private cache = new Map<K, V>();

  constructor(private capacity: number) {}

  set(key: K, value: V): void {
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      this.cache.delete(this.cache.keys().next().value!);
    }

    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  values(): V[] {
    return [...this.cache.values()];
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export function createInMemoryLRUCache<V = unknown, K extends string = string>(
  capacity: number,
): LRUCache<V, K> {
  return new InMemoryLRUCache(capacity);
}
