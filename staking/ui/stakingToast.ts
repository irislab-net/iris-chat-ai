/**
 * Thin Sonner adapters for staking (Phases 3–4). Policy SSOT: `stakingNotificationSpec.ts`.
 *
 * - Stateless wrappers + duration/dedupe defaults only.
 * - Does **not** own tx/modal state; optional `shouldEmit` is caller-supplied.
 * - Call-site ref dedupe (gas rising-edge, indexer key, receipt hash Set) stays in
 *   those modules — helpers pass `dedupeId` to Sonner for stable `id`.
 *
 * **Dedupe id shape (Phase 4):** `staking:notif:<domain>:<event>[:<fingerprint…>]`
 * via `createStakingToastDedupeKey(domain, event, ...fingerprint)`.
 */

import {
  STAKING_NOTIFICATION_DURATION_MS,
  STAKING_NOTIFICATION_DEDUPE_NAMESPACE_PREFIX,
  type StakingNotificationDurationKey,
  type StakingNotificationSeverity,
} from "@/constants/stakingNotificationSpec"
import { toast } from "sonner"
import type { ExternalToast } from "sonner"

/** Options shared by staking toast helpers (additive; no tx snapshot imports). */
export type StakingToastEmitOptions = {
  description?: string
  /** Sonner toast `id` — stable key for replace/dedupe at the stack layer */
  dedupeId?: string
  duration?: number
  /**
   * Modal-awareness / caller guard. Return `false` to skip emission entirely
   * (Phase 7+ tx paths may inject snapshot readers here).
   */
  shouldEmit?: () => boolean
}

/** @returns whether a toast may emit (default true when `shouldEmit` omitted). */
export function shouldEmitStakingToast(shouldEmit?: () => boolean): boolean {
  return shouldEmit == null || shouldEmit()
}

export function stakingToastDurationForSeverity(
  key: StakingNotificationDurationKey
): number {
  return STAKING_NOTIFICATION_DURATION_MS[key]
}

/** Stable compact fingerprint for arbitrary strings (e.g. raw indexer errors). */
export function stakingToastDedupeFingerprint(input: string): string {
  const s = input.trim()
  if (!s) return "0"
  let h = 2_166_136_261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16_777_619) >>> 0
  }
  return `f${(h >>> 0).toString(36)}`
}

function sanitizeDedupeSegment(segment: string, maxLen: number): string {
  const t = segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
  const out = t.slice(0, maxLen)
  return out.length > 0 ? out : "x"
}

/**
 * Canonical Sonner `id`: `staking:notif:<domain>:<event>` plus optional fingerprint
 * segments (each sanitized or hashed for stability). Does **not** replace ref-based
 * dedupe — use together with existing `lastKeyRef` / Set guards.
 */
export function createStakingToastDedupeKey(
  domain: string,
  event: string,
  ...fingerprint: ReadonlyArray<string | number | boolean | null | undefined>
): string {
  const d = sanitizeDedupeSegment(domain, 32)
  const e = sanitizeDedupeSegment(event, 48)
  const extras: string[] = []
  for (const p of fingerprint) {
    if (p == null || p === "") continue
    if (typeof p === "string") {
      const raw = p.trim()
      if (!raw) continue
      const simple = /^[a-z0-9_]{1,48}$/i.test(raw)
      extras.push(simple ? sanitizeDedupeSegment(raw, 48) : stakingToastDedupeFingerprint(raw))
      continue
    }
    extras.push(sanitizeDedupeSegment(String(p), 24))
  }
  const base = `${STAKING_NOTIFICATION_DEDUPE_NAMESPACE_PREFIX}${d}:${e}`
  return extras.length > 0 ? `${base}:${extras.join(":")}` : base
}

function toSonnerPayload(
  severity: StakingNotificationSeverity,
  options?: StakingToastEmitOptions
): ExternalToast {
  const durationKey: StakingNotificationDurationKey =
    severity === "success"
      ? "success"
      : severity === "warning"
        ? "warning"
        : severity === "info"
          ? "info"
          : "error"
  const duration =
    options?.duration ?? STAKING_NOTIFICATION_DURATION_MS[durationKey]
  const payload: ExternalToast = { duration }
  if (options?.description !== undefined && options.description !== "") {
    payload.description = options.description
  }
  if (options?.dedupeId !== undefined && options.dedupeId !== "") {
    payload.id = options.dedupeId
  }
  return payload
}

function emit(
  severity: StakingNotificationSeverity,
  title: string,
  options?: StakingToastEmitOptions
): ReturnType<typeof toast.error> | undefined {
  if (!shouldEmitStakingToast(options?.shouldEmit)) return undefined
  const payload = toSonnerPayload(severity, options)
  if (severity === "success") return toast.success(title, payload)
  if (severity === "warning") return toast.warning(title, payload)
  if (severity === "info") return toast.info(title, payload)
  return toast.error(title, payload)
}

export function stakingToastSuccess(
  title: string,
  options?: StakingToastEmitOptions
): ReturnType<typeof toast.success> | undefined {
  return emit("success", title, options)
}

export function stakingToastError(
  title: string,
  options?: StakingToastEmitOptions
): ReturnType<typeof toast.error> | undefined {
  return emit("error", title, options)
}

export function stakingToastWarning(
  title: string,
  options?: StakingToastEmitOptions
): ReturnType<typeof toast.warning> | undefined {
  return emit("warning", title, options)
}

export function stakingToastInfo(
  title: string,
  options?: StakingToastEmitOptions
): ReturnType<typeof toast.info> | undefined {
  return emit("info", title, options)
}
