/**
 * Basit süreç içi önbellek. Tek sunucu (Docker) kurulumunda site ve katalog okumalarını hızlandırır.
 * Panelde yapılan her değişiklik ilgili anahtarları temizler.
 */
type Entry<T> = { value: T; expires: number };

const g = globalThis as unknown as { __memCache?: Map<string, Entry<unknown>> };
const store: Map<string, Entry<unknown>> = g.__memCache ?? new Map();
g.__memCache = store;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await load();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function invalidate(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

export function invalidateAll() {
  store.clear();
}
