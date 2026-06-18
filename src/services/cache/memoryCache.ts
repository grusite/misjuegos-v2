type CacheEntry<T> = {
  value: T
  expiresAt: number
}

export function createMemoryCache(defaultTtlMs = 5 * 60_000) {
  const store = new Map<string, CacheEntry<unknown>>()

  function get<T>(key: string): T | null {
    const entry = store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      store.delete(key)
      return null
    }

    return entry.value as T
  }

  function set<T>(key: string, value: T, ttlMs = defaultTtlMs) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  function invalidate(prefix: string) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key)
    }
  }

  function clear() {
    store.clear()
  }

  return { get, set, invalidate, clear }
}

export const appDataCache = createMemoryCache()
