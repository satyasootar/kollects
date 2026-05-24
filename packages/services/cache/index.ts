export class CacheService {
  private cache: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache. Returns null if missing or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set a value in the cache with a Time-To-Live (TTL).
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Remove a specific key from the cache.
   */
  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Remove all keys matching a specific string pattern.
   * Note: In an MVP Map cache, this iterates all keys.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Purge all expired items from memory (can be run periodically).
   */
  async purgeExpired(): Promise<void> {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();
