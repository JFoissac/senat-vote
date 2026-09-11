// Node >= 24 exposes a global `localStorage` getter that returns undefined unless
// `--localstorage-file` is provided. Vitest's jsdom environment skips overriding
// already existing globals, so jsdom's implementation is never installed.
// Provide a minimal in-memory Storage so tests run identically on every Node version.
class MemoryStorage {
  #store = new Map();

  get length() {
    return this.#store.size;
  }

  clear() {
    this.#store.clear();
  }

  getItem(key) {
    const k = String(key);
    return this.#store.has(k) ? this.#store.get(k) : null;
  }

  setItem(key, value) {
    this.#store.set(String(key), String(value));
  }

  removeItem(key) {
    this.#store.delete(String(key));
  }

  key(index) {
    return [...this.#store.keys()][index] ?? null;
  }
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}
