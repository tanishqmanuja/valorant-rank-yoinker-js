export interface LRUCache<V, K extends string = string> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): void;
  clear(): void;
}
