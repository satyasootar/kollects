import { Redis } from "ioredis";

export class CacheService {
  private inMemoryCache: Map<string, { value: any; expiry: number }>;
  private redisClient: Redis | null = null;
  private purgeInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.inMemoryCache = new Map();

    if (process.env.REDIS_URL) {
      this.redisClient = new Redis(process.env.REDIS_URL);
    } else {
      // Fallback: cron-based eviction if no Redis is present (purges every 1 minute)
      this.purgeInterval = setInterval(() => {
        this.purgeExpired().catch(console.error);
      }, 60 * 1000);
      // Ensure the interval doesn't block the Node.js event loop from exiting
      if (this.purgeInterval.unref) {
        this.purgeInterval.unref();
      }
    }
  }

  /**
   * Get a value from the cache. Returns null if missing or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient) {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch (e) {
        return null;
      }
    }

    const item = this.inMemoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set a value in the cache with a Time-To-Live (TTL).
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.inMemoryCache.set(key, { value, expiry });
  }

  /**
   * Remove a specific key from the cache.
   */
  async invalidate(key: string): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.del(key);
      return;
    }
    this.inMemoryCache.delete(key);
  }

  /**
   * Remove all keys matching a specific string pattern.
   * Note: In an MVP Map cache, this iterates all keys.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (this.redisClient) {
      // We convert the pattern to Redis wildcard format
      const redisPattern = pattern.replace(/\*/g, "*"); 
      const keys = await this.redisClient.keys(redisPattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      return;
    }

    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    for (const key of this.inMemoryCache.keys()) {
      if (regex.test(key)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Purge all expired items from memory (can be run periodically).
   */
  async purgeExpired(): Promise<void> {
    if (this.redisClient) return; // Redis handles TTL automatically

    const now = Date.now();
    for (const [key, item] of this.inMemoryCache.entries()) {
      if (now > item.expiry) {
        this.inMemoryCache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();
