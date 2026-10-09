import { isStakingReferralEnabled } from "@/config/env"
import {
  REFERRAL_QUERY_KEYS,
  REFERRAL_STORAGE_KEY,
} from "@/constants/stakingVaultConfig"
import { isTelegramBrowser } from "@/lib/mobile/browserEnvironment"
import { normalizeStakingReferralAddress } from "@/lib/stakingReferralAddress"
import { readStoredReferral } from "@/lib/stakingReferralStorage"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

/** Let the staking UI paint before showing the referral saved dialog (ms). */
const REFERRAL_CAPTURE_NOTICE_DELAY_MS = 4000

export type SetStakingReferralResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Persists a valid referral address from URL query (`ref` / `affiliate`) to localStorage.
 * Policy: last valid visit overwrites the stored value.
 */
function useStakingReferral() {
  const referralsEnabled = isStakingReferralEnabled()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [referralCaptureNoticeOpen, setReferralCaptureNoticeOpen] = useState(false)
  const referralNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [storedReferral, setStoredReferral] = useState<string | null>(() =>
    readStoredReferral()
  )

  const fromQuery = useMemo(() => {
    if (!referralsEnabled) return null
    for (const key of REFERRAL_QUERY_KEYS) {
      const v = searchParams.get(key)
      const addr = normalizeStakingReferralAddress(v)
      if (addr) return addr
    }
    return null
  }, [referralsEnabled, searchParams])

  useEffect(() => {
    if (referralsEnabled) return
    if (referralNoticeTimerRef.current) {
      clearTimeout(referralNoticeTimerRef.current)
      referralNoticeTimerRef.current = null
    }
    setReferralCaptureNoticeOpen(false)
  }, [referralsEnabled])

  useEffect(() => {
    if (!referralsEnabled) return
    if (!fromQuery) return

    // Telegram WebView is unsupported for wallet flows; skip referral capture
    // entirely so:
    //   - `localStorage` isn't polluted from an environment the user must
    //     leave anyway,
    //   - the "Referral link saved" notice never appears here,
    //   - the URL bar keeps the original `?ref=` (we never strip it),
    //   so Telegram's native "Open in Browser" hands off the full URL to the
    //   real browser, where capture-and-strip then runs normally.
    if (isTelegramBrowser()) return

    localStorage.setItem(REFERRAL_STORAGE_KEY, fromQuery)
    setStoredReferral(fromQuery)

    if (referralNoticeTimerRef.current) {
      clearTimeout(referralNoticeTimerRef.current)
      referralNoticeTimerRef.current = null
    }
    referralNoticeTimerRef.current = setTimeout(() => {
      referralNoticeTimerRef.current = null
      setReferralCaptureNoticeOpen(true)
    }, REFERRAL_CAPTURE_NOTICE_DELAY_MS)

    const next = new URLSearchParams(searchParams?.toString() ?? "")
    for (const key of REFERRAL_QUERY_KEYS) {
      next.delete(key)
    }
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    // Do not clear the timer in this effect's cleanup: `fromQuery` becomes null after
    // stripping params, which would cancel the notice before it can open.
  }, [fromQuery, referralsEnabled, router, pathname, searchParams])

  useEffect(() => {
    return () => {
      if (referralNoticeTimerRef.current) {
        clearTimeout(referralNoticeTimerRef.current)
        referralNoticeTimerRef.current = null
      }
    }
  }, [])

  const clearReferral = useCallback(() => {
    if (!referralsEnabled) return
    try {
      localStorage.removeItem(REFERRAL_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setStoredReferral(null)
  }, [referralsEnabled])

  const dismissReferralCaptureNotice = useCallback(() => {
    setReferralCaptureNoticeOpen(false)
  }, [])

  const setReferral = useCallback((raw: string): SetStakingReferralResult => {
    if (!referralsEnabled) {
      return { ok: false, error: "Referrals are currently unavailable." }
    }
    const addr = normalizeStakingReferralAddress(raw)
    if (!addr) {
      return {
        ok: false,
        error: "Enter a valid non-zero Ethereum wallet address.",
      }
    }
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, addr)
    } catch {
      return { ok: false, error: "Could not save. Check browser storage permissions." }
    }
    setStoredReferral(addr)
    return { ok: true }
  }, [referralsEnabled])

  return {
    referralAddress: storedReferral,
    clearReferral,
    setReferral,
    referralCaptureNoticeOpen,
    dismissReferralCaptureNotice,
  }
}

export default useStakingReferral
