export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js 25+ ships a broken localStorage stub — polyfill it for next-auth
    const g = global as typeof globalThis & { localStorage?: Storage };
    try {
      g.localStorage?.getItem("__test__");
    } catch {
      const store: Record<string, string> = {};
      g.localStorage = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
        key: () => null,
        get length() { return Object.keys(store).length; },
      } as Storage;
    }

    const { initDatabase } = await import("./lib/init-db");
    await initDatabase();
  }
}
