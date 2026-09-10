export type RateLimitScope = "user" | "wallet" | "asset"

export type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

export type RateLimitCheckResult =
  | { allowed: true }
  | { allowed: false; scope: RateLimitScope; retryAfterMs: number }

type Bucket = {
  timestamps: number[]
}

export class ExecutionRateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(private readonly config: RateLimitConfig) {}

  private key(scope: RateLimitScope, id: string): string {
    return `${scope}:${id}`
  }

  check(scope: RateLimitScope, id: string, now = Date.now()): RateLimitCheckResult {
    const bucketKey = this.key(scope, id)
    const bucket = this.buckets.get(bucketKey) ?? { timestamps: [] }
    bucket.timestamps = bucket.timestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    )
    this.buckets.set(bucketKey, bucket)

    if (bucket.timestamps.length >= this.config.maxRequests) {
      const oldest = bucket.timestamps[0] ?? now
      return {
        allowed: false,
        scope,
        retryAfterMs: Math.max(0, this.config.windowMs - (now - oldest)),
      }
    }
    return { allowed: true }
  }

  record(scope: RateLimitScope, id: string, now = Date.now()): void {
    const bucketKey = this.key(scope, id)
    const bucket = this.buckets.get(bucketKey) ?? { timestamps: [] }
    bucket.timestamps.push(now)
    this.buckets.set(bucketKey, bucket)
  }

  checkAll(input: {
    userId: string
    walletIdentityId: string
    symbol: string
    now?: number
  }): RateLimitCheckResult {
    const now = input.now ?? Date.now()
    for (const [scope, id] of [
      ["user", input.userId],
      ["wallet", input.walletIdentityId],
      ["asset", `${input.walletIdentityId}:${input.symbol.toUpperCase()}`],
    ] as const) {
      const result = this.check(scope, id, now)
      if (!result.allowed) return result
    }
    return { allowed: true }
  }

  recordAll(input: {
    userId: string
    walletIdentityId: string
    symbol: string
    now?: number
  }): void {
    const now = input.now ?? Date.now()
    this.record("user", input.userId, now)
    this.record("wallet", input.walletIdentityId, now)
    this.record("asset", `${input.walletIdentityId}:${input.symbol.toUpperCase()}`, now)
  }
}

export const DEFAULT_EXECUTION_RATE_LIMIT: RateLimitConfig = {
  windowMs: 10_000,
  maxRequests: 8,
}
