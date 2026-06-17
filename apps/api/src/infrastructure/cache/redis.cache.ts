import Redis from 'ioredis'
import type { ICacheService } from '@/application/ports/services/cache.service.port.js'
import { logger } from '@/infrastructure/logger/logger.js'

/**
 * Falls back to in-memory Map if Redis is unavailable.
 * Means the app starts cleanly in XAMPP dev env without Redis installed.
 */
export class RedisCache implements ICacheService {
  private readonly client: Redis | null
  private readonly memoryStore = new Map<string, { value: string; expiresAt: number }>()
  private warnedOnce = false

  constructor() {
    const url = process.env['REDIS_URL']
    if (url) {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      })
      this.client.on('error', () => {
        if (!this.warnedOnce) {
          this.warnedOnce = true
          logger.info('[Cache] Redis unavailable — using in-memory cache')
        }
      })
    } else {
      this.client = null
      logger.info('[Cache] No REDIS_URL — using in-memory cache')
    }
  }

  private memGet(key: string) {
    const entry = this.memoryStore.get(key)
    if (!entry || entry.expiresAt < Date.now()) return null
    return entry.value
  }

  private memSet(key: string, serialized: string, ttlSeconds: number) {
    this.memoryStore.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const val = await this.client.get(key)
        return val ? (JSON.parse(val) as T) : null
      } catch { /* fall through to memory */ }
    }
    const raw = this.memGet(key)
    return raw ? (JSON.parse(raw) as T) : null
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (this.client) {
      try { await this.client.setex(key, ttlSeconds, serialized); return } catch { /* fall through */ }
    }
    this.memSet(key, serialized, ttlSeconds)
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try { await this.client.del(key); return } catch { /* fall through */ }
    }
    this.memoryStore.delete(key)
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.client) {
      try {
        const keys = await this.client.keys(pattern)
        if (keys.length) await this.client.del(...keys)
        return
      } catch { /* fall through */ }
    }
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) this.memoryStore.delete(key)
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.client) {
      try { return (await this.client.exists(key)) === 1 } catch { /* fall through */ }
    }
    const entry = this.memoryStore.get(key)
    return !!entry && entry.expiresAt > Date.now()
  }

  async increment(key: string): Promise<number> {
    if (this.client) {
      try { return await this.client.incr(key) } catch { /* fall through */ }
    }
    const entry = this.memoryStore.get(key)
    const current = entry ? parseInt(JSON.parse(entry.value) as string) : 0
    const next = current + 1
    this.memoryStore.set(key, { value: JSON.stringify(next), expiresAt: Infinity })
    return next
  }

  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.client) {
      try {
        const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX')
        return result === 'OK'
      } catch { /* fall through */ }
    }
    if (await this.exists(key)) return false
    await this.set(key, value, ttlSeconds)
    return true
  }
}
