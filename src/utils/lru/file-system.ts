import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join, parse } from "path";

import { tryCatch } from "../promise";
import { LRUCache } from "./interface";

type FileLRUOptions = {
  fileToKey: (filename: string) => string;
  keyToFile: (key: string) => string;
  serialize: (value: unknown) => string;
  deserialize: (value: string) => unknown;
};

const JSONFileLRUOptions: FileLRUOptions = {
  fileToKey: (filename: string) => parse(filename).name,
  keyToFile: (key: string) => `${key}.json`,
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

export class FileSystemLRUCache<V = unknown> implements LRUCache<V> {
  private register = new Set<string>();

  constructor(
    private dirpath: string,
    private capacity: number,
    private opts: FileLRUOptions = JSONFileLRUOptions,
  ) {
    mkdirSync(this.dirpath, { recursive: true });

    this.load();
    this.clean();
  }

  private load() {
    try {
      const registerSerialized = readFileSync(
        join(this.dirpath, `.register`),
        "utf-8",
      );
      const register: Array<string> = JSON.parse(registerSerialized);
      register.forEach(key => {
        this.register.add(key);
      });
    } catch {} // ignored-catch
  }

  private save(): void {
    writeFileSync(
      join(this.dirpath, `.register`),
      JSON.stringify([...this.register.values()]),
    );
  }

  private clean() {
    const existingFiles = readdirSync(this.dirpath, { withFileTypes: true });
    existingFiles.forEach(file => {
      if (file.isFile() && !this.register.has(this.opts.fileToKey(file.name))) {
        tryCatch(() => rmSync(join(this.dirpath, file.name)));
      }
    });
  }

  set(key: string, value: V): void {
    if (this.register.size >= this.capacity && !this.register.has(key)) {
      const key = this.register.keys().next().value;
      this.register.delete(key!);
      tryCatch(() => rmSync(join(this.dirpath, this.opts.keyToFile(key!))));
    }

    const filepath = join(this.dirpath, this.opts.keyToFile(key));
    const filedata = this.opts.serialize(value);
    writeFileSync(filepath, filedata, "utf-8");
    this.register.add(key);
    return this.save();
  }

  get(key: string): V | undefined {
    if (!this.register.has(key)) return undefined;

    const value = tryCatch(
      () =>
        this.opts.deserialize(
          readFileSync(join(this.dirpath, this.opts.keyToFile(key)), "utf-8"),
        ) as V,
      () => undefined,
    );

    if (value) {
      this.register.delete(key);
      this.register.add(key);
    }

    return value;
  }

  has(key: string): boolean {
    return this.register.has(key);
  }

  delete(key: string): void {
    if (!this.register.has(key)) return;

    tryCatch(() => {
      rmSync(join(this.dirpath, this.opts.keyToFile(key)));
    });
    this.register.delete(key);
    this.save();
  }

  clear(): void {
    this.register.clear();
    this.clean();
    this.save();
  }
}

export function createFileSystemLRUCache<V = unknown>(
  dirpath: string,
  capacity: number,
  opts: FileLRUOptions = JSONFileLRUOptions,
): LRUCache<V> {
  return new FileSystemLRUCache(dirpath, capacity, opts);
}
