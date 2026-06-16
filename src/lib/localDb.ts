// Shop-scoped localStorage helper for demo/auxiliary modules
// (Karigars, Rate History, Ledger entries) that don't yet exist in the backend API.
// Keys are namespaced by the active shop's id so multi-tenant logins stay isolated.

function shopKey(): string {
  try {
    const s = JSON.parse(localStorage.getItem("currentShop") || "{}");
    return String(s.id || s.email || "default");
  } catch {
    return "default";
  }
}

function k(name: string) {
  return `erp:${shopKey()}:${name}`;
}

export const localDb = {
  read<T>(name: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(k(name));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  write<T>(name: string, value: T) {
    try {
      localStorage.setItem(k(name), JSON.stringify(value));
    } catch (e) {
      console.error("localDb write failed", e);
    }
  },
  push<T>(name: string, item: T): T[] {
    const list = localDb.read<T[]>(name, []);
    list.unshift(item);
    localDb.write(name, list);
    return list;
  },
  remove<T extends { id: string }>(name: string, id: string): T[] {
    const list = localDb.read<T[]>(name, []);
    const next = list.filter((x) => x.id !== id);
    localDb.write(name, next);
    return next;
  },
  update<T extends { id: string }>(name: string, id: string, patch: Partial<T>): T[] {
    const list = localDb.read<T[]>(name, []);
    const next = list.map((x) => (x.id === id ? { ...x, ...patch } : x));
    localDb.write(name, next);
    return next;
  },
};

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const inr = (n: number) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
