export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  exists(key: string): Promise<boolean>
  increment(key: string): Promise<number>
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>
}

export const CACHE_KEYS = {
  product:          (id: string) => `product:${id}`,
  productSearch:    (hash: string) => `products:search:${hash}`,
  vendorProfile:    (id: string) => `vendor:${id}`,
  categories:       () => `categories:all`,
  userSession:      (id: string) => `session:${id}`,
  rateLimitCounter: (ip: string, route: string) => `rate:${ip}:${route}`,
  availability:     (productId: string, month: string) => `avail:${productId}:${month}`,
} as const
