import {
  STAKING_TERMS_STORAGE_KEY,
  STAKING_TERMS_STORAGE_VALUE,
} from "@/constants/stakingTermsConsent"
import { readViteStakingTermsUrl } from "@/staking/config"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  createStakingToastDedupeKey,
  stakingToastError,
} from "@/staking/ui"
import {
  StakingTermsConsentContext,
  type StakingTermsConsentContextValue,
} from "./stakingTermsConsentContext"

function readAcceptedFromStorage(): { ok: boolean; accepted: boolean } {
  try {
    if (typeof localStorage === "undefined") {
      return { ok: false, accepted: false }
    }
    const raw = localStorage.getItem(STAKING_TERMS_STORAGE_KEY)
    return {
      ok: true,
      accepted: raw === STAKING_TERMS_STORAGE_VALUE,
    }
  } catch {
    return { ok: false, accepted: false }
  }
}

function initialAcceptedFromStorage(): boolean {
  const { ok, accepted } = readAcceptedFromStorage()
  return ok ? accepted : false
}

/** After the user lands on staking, auto-open the terms modal once if they have not accepted yet. */
const STAKING_TERMS_AUTO_PROMPT_DELAY_MS = 5000

export function StakingTermsConsentProvider({ children }: { children: ReactNode }) {
  /**
   * Terms consent is read from `localStorage` synchronously — there is no async
   * hydration phase. Keeping `ready === true` from the first paint avoids bogus
   * `TERMS_NOT_READY` / `ensureAcceptedOrPrompt` races during bootstrap (incl.
   * React 18 StrictMode effect ordering).
   */
  const ready = true
  const [accepted, setAccepted] = useState(initialAcceptedFromStorage)
  const [dialogOpen, setDialogOpen] = useState(false)
  const scrollLockPrevOverflowY = useRef<string | null>(null)

  const termsUrl = useMemo(() => readViteStakingTermsUrl(), [])

  useLayoutEffect(() => {
    const { ok, accepted: fromStorage } = readAcceptedFromStorage()
    setAccepted(ok ? fromStorage : false)
    setDialogOpen(false)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return
      if (e.key !== STAKING_TERMS_STORAGE_KEY) return
      if (e.newValue === STAKING_TERMS_STORAGE_VALUE) {
        setAccepted(true)
        setDialogOpen(false)
      } else if (e.newValue === null || e.newValue === "") {
        setAccepted(false)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    if (!dialogOpen) return
    scrollLockPrevOverflowY.current = document.body.style.overflowY
    document.body.style.overflowY = "hidden"
    return () => {
      document.body.style.overflowY =
        scrollLockPrevOverflowY.current === null
          ? ""
          : scrollLockPrevOverflowY.current
      scrollLockPrevOverflowY.current = null
    }
  }, [dialogOpen])

  useEffect(() => {
    if (accepted) return
    const timerId = window.setTimeout(() => {
      setDialogOpen(open => (open ? open : true))
    }, STAKING_TERMS_AUTO_PROMPT_DELAY_MS)
    return () => window.clearTimeout(timerId)
  }, [accepted])

  const acceptTerms = useCallback(() => {
    try {
      localStorage.setItem(STAKING_TERMS_STORAGE_KEY, STAKING_TERMS_STORAGE_VALUE)
    } catch {
      stakingToastError("Terms not saved", {
        description: "Allow site storage, then tap Accept again.",
        dedupeId: createStakingToastDedupeKey("terms", "storage_write"),
      })
      return
    }
    setAccepted(true)
    setDialogOpen(false)
  }, [])

  const onDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
  }, [])

  const ensureAcceptedOrPrompt = useCallback((): boolean => {
    if (accepted) {
      return true
    }
    if (dialogOpen) {
      return false
    }
    setDialogOpen(true)
    return false
  }, [accepted, dialogOpen])

  const value = useMemo<StakingTermsConsentContextValue>(
    () => ({
      ready,
      accepted,
      dialogOpen,
      termsUrl,
      acceptTerms,
      onDialogOpenChange,
      ensureAcceptedOrPrompt,
    }),
    [
      ready,
      accepted,
      dialogOpen,
      termsUrl,
      acceptTerms,
      onDialogOpenChange,
      ensureAcceptedOrPrompt,
    ]
  )

  return (
    <StakingTermsConsentContext.Provider value={value}>
      {children}
    </StakingTermsConsentContext.Provider>
  )
}
