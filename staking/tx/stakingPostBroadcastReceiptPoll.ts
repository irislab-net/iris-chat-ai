import type { ChainReceiptResolver } from "@/staking/core/persistenceTypes"

const RECEIPT_POLL_INTERVAL_MS = 4_000
/** Upper bound for background poll after reload / detached continuity (matches session TTL scale). */
const RECEIPT_POLL_MAX_MS = 48 * 60 * 60 * 1000

/**
 * Resolves when the on-chain receipt is terminal; rejects on failure or poll timeout.
 * Used when the in-memory `receiptWait` from broadcast was lost (reload / BFCache).
 */
export function createPolledReceiptWait(
  resolver: ChainReceiptResolver,
  txHash: string,
  signal?: AbortSignal
): Promise<void> {
  const hash = txHash.trim()
  if (!hash) {
    return Promise.reject(new Error("receipt_poll_empty_hash"))
  }

  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }

    const fail = (err: Error) => {
      cleanup()
      reject(err)
    }

    const onAbort = () => {
      fail(new DOMException("receipt_poll_aborted", "AbortError"))
    }

    signal?.addEventListener("abort", onAbort, { once: true })

    const tick = async () => {
      if (signal?.aborted) return
      if (Date.now() - startedAt > RECEIPT_POLL_MAX_MS) {
        fail(new Error("receipt_poll_timeout"))
        return
      }

      try {
        const summary = await resolver.getReceiptSummary(hash, signal)
        if (summary?.status === "success") {
          cleanup()
          signal?.removeEventListener("abort", onAbort)
          resolve()
          return
        }
        if (summary?.status === "failure") {
          fail(new Error("receipt_failed"))
          return
        }
      } catch {
        /* RPC blip — keep polling */
      }

      timer = setTimeout(() => {
        void tick()
      }, RECEIPT_POLL_INTERVAL_MS)
    }

    void tick()
  })
}
