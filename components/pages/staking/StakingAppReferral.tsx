import GlowingButton from "@/components/common/glowingButton"
import { StakingModalDialogDismiss } from "@/components/common/StakingModalDialogDismiss"
import {
  STAKING_BALANCE_LIQUID_CARD,
  STAKING_COLUMN_LIQUID_PANEL,
} from "@/components/pages/staking/stakingGlassPanel"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { formatAffiliateRewardSummaryDisplay } from "@/staking/affiliate/stakingAffiliatePresentation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/staking-dialog"
import { Textarea } from "@/components/ui/textarea"
import type { SetStakingReferralResult } from "@/hooks/useStakingReferral"
import { copyTextToClipboard } from "@/lib/copyToClipboard"
import { STAKING_TEXTAREA } from "@/staking/ui"
import { normalizeStakingReferralAddress } from "@/lib/stakingReferralAddress"
import {
  STAKING_MODAL_ELEVATION_SHEET,
  STAKING_MODAL_OVERLAY_GLASS_BASE,
  STAKING_MODAL_PADDING_CONTENT,
  STAKING_MODAL_RADIUS_SHEET_BOTTOM_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_TOP_MAX_SM,
  STAKING_MODAL_SAFE_AREA_BOTTOM,
  STAKING_MODAL_SCROLL_BODY_MAX_TALL,
  STAKING_MODAL_SHEET_DESKTOP_PLACEMENT,
  STAKING_MODAL_SHEET_HANDLE_BAR,
  STAKING_MODAL_SHEET_HANDLE_STRIP_ROW,
  STAKING_MODAL_SHEET_INSET_MAX_SM,
  STAKING_MODAL_SHEET_MAX_HEIGHT_TALL_MAX_SM,
  STAKING_MODAL_SHEET_SLIDE_ANIM_MAX_SM,
  STAKING_MODAL_SPACING_HEADER_TIGHT,
  STAKING_MODAL_TYPE_SHEET_DESCRIPTION,
  STAKING_MODAL_TYPE_SHEET_TITLE,
  STAKING_MODAL_WIDTH_SHEET_SM,
  STAKING_MODAL_WIDTH_SHEET_SM_NARROW,
} from "@/constants/stakingModalSpec"
import { cn } from "@/lib/utils"
import { getAddress, isAddress } from "ethers"
import {
  CheckCircle,
  Coins,
  Files,
  Gem,
  Loader2,
  Save,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react"
import {
  createStakingToastDedupeKey,
  stakingToastError,
} from "@/staking/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const inviteCountFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const referralDialogShellClass = cn(
  STAKING_COLUMN_LIQUID_PANEL,
  "gap-0 overflow-hidden border-0 p-0 font-sans",
  STAKING_MODAL_ELEVATION_SHEET,
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
  STAKING_MODAL_SHEET_INSET_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_TOP_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_BOTTOM_MAX_SM,
  STAKING_MODAL_SHEET_SLIDE_ANIM_MAX_SM,
  STAKING_MODAL_SAFE_AREA_BOTTOM
)

const REFERRAL_COPY_FEEDBACK_MS = 2000

/** Shared tap height for every referral modal `GlowingButton` (matches deposit CTA). */
const referralModalGlowTallShell =
  "w-full justify-center rounded-full px-6 py-0 font-mono text-base min-h-12 h-12 sm:min-h-10 sm:h-10 sm:text-sm disabled:opacity-70"

const referralModalGlowPrimaryButtonClass = cn(
  referralModalGlowTallShell,
  "border-0 bg-[#2563EB]/88 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),0_4px_16px_-4px_rgba(37,99,235,0.28)] hover:bg-[#2563EB]/96"
)

const referralModalGlowOutlineButtonClass = cn(
  referralModalGlowTallShell,
  "border border-white/55 bg-white/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:bg-white/90 dark:border-white/16 dark:bg-white/10 dark:hover:bg-white/14"
)

const referralModalGlowDestructiveButtonClass = cn(
  referralModalGlowTallShell,
  "border-0 bg-destructive text-white shadow-xs hover:bg-destructive/90"
)

/** Small round save FAB inside referrer textarea — active when draft differs from stored referrer. */
const referrerSaveFabBase =
  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-[opacity,transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"

const referrerSaveFabActiveClass = cn(
  referrerSaveFabBase,
  "border-[#2563EB]/50 bg-[#2563EB]/88 text-white shadow-sm hover:bg-[#2563EB]/96 active:scale-[0.96]"
)

const referrerSaveFabIdleClass = cn(
  referrerSaveFabBase,
  "cursor-not-allowed border-neutral-200/80 bg-white/35 text-neutral-300 shadow-none opacity-55"
)

export type StakingAppReferralProps = {
  stakingReferral: {
    referralAddress: string | null
    clearReferral: () => void
    setReferral: (raw: string) => SetStakingReferralResult
    referralCaptureNoticeOpen: boolean
    dismissReferralCaptureNotice: () => void
  }
}

function StakingAppReferral({ stakingReferral }: StakingAppReferralProps) {
  const {
    referralAddress,
    clearReferral,
    setReferral,
    referralCaptureNoticeOpen,
    dismissReferralCaptureNotice,
  } = stakingReferral
  const {
    executionAddress,
    affiliateFirebaseConfigured: configured,
    affiliateStatsLoading: loading,
    affiliateStats: stats,
  } = useStakingVault()
  const [isCompactWidth, setIsCompactWidth] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)")
    const apply = () => setIsCompactWidth(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  /** Full URL with full checksummed `ref` — always used for clipboard. */
  const referralUrlFull = useMemo(() => {
    if (typeof window === "undefined" || !executionAddress) return ""
    const refParam = isAddress(executionAddress)
      ? getAddress(executionAddress)
      : executionAddress
    const u = new URL("/app", window.location.origin)
    u.searchParams.set("ref", refParam)
    return u.href
  }, [executionAddress])

  /** Truncated preview only (short `ref`); never use for clipboard. */
  const referralUrlDisplay = useMemo(() => {
    if (!referralUrlFull || !executionAddress) return ""
    const head = isCompactWidth ? 4 : 6
    const short =
      executionAddress.length > head + 5
        ? `${executionAddress.slice(0, head)}…${executionAddress.slice(-4)}`
        : executionAddress
    if (typeof window === "undefined") return ""
    return `${window.location.host}/app?ref=${short}`
  }, [referralUrlFull, executionAddress, isCompactWidth])

  const handleCopyCapture = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (!referralUrlFull) return
      e.preventDefault()
      e.clipboardData?.setData("text/plain", referralUrlFull)
    },
    [referralUrlFull]
  )

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current)
        copyFeedbackTimerRef.current = null
      }
    }
  }, [])

  const copyReferralLink = useCallback(async () => {
    if (!referralUrlFull) return
    const ok = await copyTextToClipboard(referralUrlFull)
    if (!ok) {
      stakingToastError("Copy blocked", {
        description: "Use HTTPS or localhost, or copy the link manually.",
        dedupeId: createStakingToastDedupeKey("referral", "copy_fail"),
      })
      return
    }
    setReferralCopied(true)
    if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current)
    copyFeedbackTimerRef.current = setTimeout(() => {
      setReferralCopied(false)
      copyFeedbackTimerRef.current = null
    }, REFERRAL_COPY_FEEDBACK_MS)
  }, [referralUrlFull])

  const onReferralRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!referralUrlFull) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        void copyReferralLink()
      }
    },
    [referralUrlFull, copyReferralLink]
  )

  const [manageOpen, setManageOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editDraft, setEditDraft] = useState("")
  const [editFieldError, setEditFieldError] = useState<string | null>(null)
  const [saveReferrerBusy, setSaveReferrerBusy] = useState(false)

  const resetManageModal = useCallback(() => {
    setConfirmDelete(false)
    setEditDraft("")
    setEditFieldError(null)
    setSaveReferrerBusy(false)
  }, [])

  const onReferralCaptureNoticeOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dismissReferralCaptureNotice()
    },
    [dismissReferralCaptureNotice],
  )

  const onManageOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetManageModal()
      setManageOpen(open)
    },
    [resetManageModal],
  )

  useEffect(() => {
    if (!manageOpen || confirmDelete) return
    setEditDraft(referralAddress ?? "")
    setEditFieldError(null)
  }, [manageOpen, confirmDelete, referralAddress])

  const validateEditDraft = useCallback(
    (raw: string): { ok: true; checksummed: string } | { ok: false; error: string } => {
      const trimmed = raw.trim()
      const normalized = normalizeStakingReferralAddress(trimmed)
      if (!normalized) {
        return { ok: false, error: "Enter a valid non-zero Ethereum wallet address." }
      }
      if (
        executionAddress &&
        isAddress(executionAddress) &&
        normalized.toLowerCase() === getAddress(executionAddress).toLowerCase()
      ) {
        return { ok: false, error: "You cannot use your own wallet as the referrer." }
      }
      return { ok: true, checksummed: normalized }
    },
    [executionAddress]
  )

  /** True after user types, edits, or pastes so the field differs from the last synced referrer. */
  const referrerEditDirty = useMemo(() => {
    const baseline = (referralAddress ?? "").trim()
    return editDraft.trim() !== baseline
  }, [editDraft, referralAddress])

  const confirmEditReferrer = useCallback(() => {
    if (saveReferrerBusy) return
    setEditFieldError(null)
    const result = validateEditDraft(editDraft)
    if (!result.ok) {
      setEditFieldError(result.error)
      return
    }
    if (referralAddress && result.checksummed === referralAddress) {
      setEditFieldError(null)
      return
    }
    setSaveReferrerBusy(true)
    const checksummed = result.checksummed
    const runSave = () => {
      const res = setReferral(checksummed)
      setSaveReferrerBusy(false)
      if (!res.ok) {
        setEditFieldError(res.error)
        return
      }
      setEditFieldError(null)
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(runSave)
    })
  }, [
    editDraft,
    referralAddress,
    saveReferrerBusy,
    validateEditDraft,
    setReferral,
  ])

  const confirmRemoveReferrer = useCallback(() => {
    clearReferral()
    resetManageModal()
    setManageOpen(false)
  }, [clearReferral, resetManageModal])

  return (
    <div>
      <Dialog
        open={referralCaptureNoticeOpen}
        onOpenChange={onReferralCaptureNoticeOpenChange}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={STAKING_MODAL_OVERLAY_GLASS_BASE}
          className={cn(
            referralDialogShellClass,
            STAKING_MODAL_WIDTH_SHEET_SM_NARROW,
            STAKING_MODAL_SHEET_DESKTOP_PLACEMENT
          )}
        >
          <div className={STAKING_MODAL_SHEET_HANDLE_STRIP_ROW} aria-hidden>
            <span className={STAKING_MODAL_SHEET_HANDLE_BAR} />
          </div>
          <div className={STAKING_MODAL_PADDING_CONTENT}>
            <DialogHeader
              className={cn(
                STAKING_MODAL_SPACING_HEADER_TIGHT,
                "px-0 pt-1 pb-1 text-center"
              )}
            >
              <DialogTitle className={STAKING_MODAL_TYPE_SHEET_TITLE}>
                Referral link saved
              </DialogTitle>
              {referralAddress ? (
                <div className="mt-4">
                  <p
                    className='break-all bg-gray-100 rounded-xl p-2 py-4 font-mono text-[13px] leading-snug text-neutral-900 [text-wrap:anywhere]'
                    aria-label={`Referrer wallet ${referralAddress}`}
                  >
                    {referralAddress}
                  </p>
                </div>
              ) : null}
              <DialogDescription
                className={cn(
                  STAKING_MODAL_TYPE_SHEET_DESCRIPTION,
                  referralAddress ? "pt-1" : ""
                )}
              >
                This referral link has been saved for you. To manage it edit or remove tap the
                settings icon{" "}
                <Settings2
                  className='inline size-[18px] align-text-bottom text-neutral-600 opacity-90'
                  strokeWidth={2}
                  aria-hidden
                />{" "}
                next to Referral.
              </DialogDescription>
            </DialogHeader>
            <div className='mt-5'>
              <GlowingButton
                type='button'
                className='w-full rounded-full'
                buttonClassName={referralModalGlowPrimaryButtonClass}
                size='lg'
                variant='default'
                onClick={dismissReferralCaptureNotice}
              >
                OK, understood
              </GlowingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className='px-2'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            <Gem className='size-4 shrink-0 text-black' aria-hidden />
            <span className='text-[16px] font-semibold text-black'>Referral</span>
            <span className='text-[14px] font-normal text-gray-400'>Unlimited</span>
          </div>
          <Button variant={"ghost"} size={"icon"} onClick={() => setManageOpen(true)}>
            <Settings2 className='size-4' strokeWidth={2} />
          </Button>
        </div>
        <p className='text-[12px] font-normal leading-normal text-gray-500 hidden'>
          Share your link. Stakes credit you when yours was the last they opened before staking.
        </p>
      </div>

      <div className='mt-2'>
        <div
          className={cn(
            STAKING_BALANCE_LIQUID_CARD,
            "flex h-9 w-full min-w-0 items-center gap-1.5 px-2 pr-1 sm:h-9 sm:gap-2 sm:px-3 sm:pr-1.5",
            !referralUrlFull && "opacity-75",
            referralUrlFull && "cursor-pointer select-none"
          )}
          role={referralUrlFull ? "button" : undefined}
          tabIndex={referralUrlFull ? 0 : undefined}
          aria-label={
            referralUrlFull
              ? referralCopied
                ? "Referral link copied"
                : "Copy referral link"
              : undefined
          }
          onClick={referralUrlFull ? () => void copyReferralLink() : undefined}
          onKeyDown={onReferralRowKeyDown}
          onCopy={handleCopyCapture}
        >
          {referralUrlFull ? (
            <span className='flex min-h-0 min-w-0 flex-1 items-center overflow-hidden'>
              <span className='block w-full min-w-0 truncate font-mono text-[11px] leading-tight font-normal text-neutral-800 sm:text-[13px]'>
                <span className='text-gray-400'>https://</span>
                {referralUrlDisplay}
              </span>
            </span>
          ) : (
            <span
              className='flex min-h-0 min-w-0 flex-1 items-center truncate font-mono text-[11px] leading-tight sm:text-[13px]'
              role='status'
            >
              <span className='sr-only'>No referral link until your wallet is connected.</span>
              <span className='min-w-0 truncate'>
                <span className='text-gray-400' aria-hidden>
                  https://
                </span>
                <span className='text-neutral-300' aria-hidden>
                  …
                </span>
              </span>
            </span>
          )}

          <div
            className={cn(
              "flex h-8 shrink-0 items-center rounded-full px-2 gap-0 sm:px-2.5",
              referralUrlFull && "pointer-events-none hover:bg-white/45",
              !referralUrlFull && "opacity-40"
            )}
            aria-hidden
          >
            <span className='relative inline-grid size-3.5 shrink-0 place-items-center sm:size-4'>
              <Files
                className={cn(
                  "col-start-1 row-start-1 size-3.5 text-neutral-800 transition-[opacity,transform] duration-300 ease-out sm:size-4",
                  referralCopied ? "scale-90 opacity-0" : "scale-100 opacity-100"
                )}
                aria-hidden
              />
              <CheckCircle
                className={cn(
                  "col-start-1 row-start-1 size-3.5 text-neutral-800 transition-[opacity,transform] duration-300 ease-out sm:size-4",
                  referralCopied ? "scale-100 opacity-100" : "scale-90 opacity-0"
                )}
                aria-hidden
              />
            </span>
            <span className='inline-grid grid-cols-1 grid-rows-1 place-items-center text-[11px] font-medium leading-none text-neutral-800 sm:text-xs'>
              <span className='invisible col-start-1 row-start-1 select-none' aria-hidden>
                Copied
              </span>
              <span className='col-start-1 row-start-1 grid grid-cols-1 grid-rows-1 place-items-center'>
                <span
                  className={cn(
                    "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
                    referralCopied ? "opacity-0" : "opacity-100"
                  )}
                >
                  Copy
                </span>
                <span
                  className={cn(
                    "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
                    referralCopied ? "opacity-100" : "opacity-0"
                  )}
                >
                  Copied
                </span>
              </span>
            </span>
          </div>
        </div>
        <span className='sr-only' aria-live='polite'>
          {referralCopied ? "Copied to clipboard" : ""}
        </span>
      </div>
      <div className='mt-3 flex min-w-0 flex-row flex-nowrap items-stretch gap-4 px-2 sm:gap-10 sm:justify-between'>
        <div
          className={cn(
            "flex min-h-9 min-w-0 flex-1 basis-0 flex-nowrap items-center justify-between gap-1 whitespace-nowrap py-2 ps-1 pe-0.5 sm:gap-2 sm:ps-2.5 sm:pe-3 sm:py-2"
          )}
        >
          <div className='flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5'>
            <Users className='size-3 shrink-0 text-[#888888] sm:size-3.5' aria-hidden />
            <span className='shrink-0 text-[11px] font-normal text-[#555555] sm:text-[13px]'>
              Invited:
            </span>
          </div>
          <span className='min-w-0 shrink-0 ps-0.5 text-right text-[11px] font-semibold text-black tabular-nums sm:ps-1 sm:text-[13px]'>
            {configured && executionAddress && loading && !stats ? (
              <span className='font-mono text-[11px] font-normal text-neutral-500 sm:text-[13px]' aria-busy>
                …
              </span>
            ) : stats && configured ? (
              <span className='inline-flex max-w-full items-baseline gap-0.5 font-mono text-[11px] tabular-nums sm:gap-1 sm:text-[13px]'>
                <span>{inviteCountFormatter.format(stats.uniqueUsers)}</span>
                <span className='font-thin text-gray-400'>User</span>
              </span>
            ) : (
              <span className='font-mono text-[11px] font-thin text-gray-400 sm:text-[13px]'>
                0&nbsp;User
              </span>
            )}
          </span>
        </div>
        <div
          className={cn(
            "flex min-h-9 min-w-0 flex-1 basis-0 flex-nowrap items-center justify-between gap-1 whitespace-nowrap py-2 ps-1 pe-0.5 sm:gap-2 sm:ps-2.5 sm:pe-3 sm:py-2"
          )}
        >
          <div className='flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5'>
            <Coins className='size-3 shrink-0 text-[#888888] sm:size-3.5' aria-hidden />
            <span className='shrink-0 text-[11px] font-normal text-[#555555] sm:text-[13px]'>
              Rewards:
            </span>
          </div>
          <span className='min-w-0 shrink-0 ps-0.5 text-right text-[11px] font-semibold text-black tabular-nums sm:ps-1 sm:text-[13px]'>
            {configured && executionAddress && loading && !stats ? (
              <span className='font-mono text-[11px] font-normal text-neutral-500 sm:text-[13px]' aria-busy>
                …
              </span>
            ) : stats && configured ? (
              <span className='font-mono text-[11px] font-normal tabular-nums text-black sm:text-[13px]'>
                {formatAffiliateRewardSummaryDisplay(stats.totalUsdSource)}
              </span>
            ) : (
              <span className='font-mono text-[11px] font-thin text-gray-400 sm:text-[13px]'>
                {formatAffiliateRewardSummaryDisplay(0)}
              </span>
            )}
          </span>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={onManageOpenChange}>
        <DialogContent
          showCloseButton={false}
          overlayClassName={STAKING_MODAL_OVERLAY_GLASS_BASE}
          className={cn(
            referralDialogShellClass,
            STAKING_MODAL_SHEET_MAX_HEIGHT_TALL_MAX_SM,
            STAKING_MODAL_WIDTH_SHEET_SM,
            STAKING_MODAL_SHEET_DESKTOP_PLACEMENT
          )}
        >
          <div className={STAKING_MODAL_SHEET_HANDLE_STRIP_ROW} aria-hidden>
            <span className={STAKING_MODAL_SHEET_HANDLE_BAR} />
          </div>

          <StakingModalDialogDismiss />

          <div
            className={cn(
              "relative overflow-y-auto px-4 pt-1 pb-4 sm:px-5",
              STAKING_MODAL_SCROLL_BODY_MAX_TALL
            )}
          >
            {confirmDelete ? (
              <>
                <DialogHeader className='space-y-2 px-1 pt-2 pb-1 text-center sm:text-center'>
                  <DialogTitle className={STAKING_MODAL_TYPE_SHEET_TITLE}>
                    Remove saved referrer?
                  </DialogTitle>
                  <DialogDescription className={STAKING_MODAL_TYPE_SHEET_DESCRIPTION}>
                    Future stakes will not use a referrer unless you open a new referral link on this
                    device.
                  </DialogDescription>
                </DialogHeader>
                <div className='mt-5 flex flex-col gap-2.5'>
                  <GlowingButton
                    type='button'
                    className='w-full rounded-full'
                    buttonClassName={referralModalGlowDestructiveButtonClass}
                    size='lg'
                    variant='destructive'
                    onClick={confirmRemoveReferrer}
                  >
                    Remove
                  </GlowingButton>
                  <GlowingButton
                    type='button'
                    className='w-full rounded-full'
                    buttonClassName={referralModalGlowOutlineButtonClass}
                    size='lg'
                    variant='outline'
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </GlowingButton>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className='space-y-0 px-1 pt-2 pb-2 text-left'>
                  <DialogTitle className='text-left text-base font-semibold leading-snug tracking-tight text-black'>
                    Manage Referrals
                  </DialogTitle>
                  <DialogDescription className='sr-only'>
                    Paste, save, or remove the referral link used for future stakes.
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                  <section aria-labelledby='set-referrer-heading' className='mt-4'>
                    <h2
                      id='set-referrer-heading'
                      className={cn("flex items-center gap-2 px-2 font-light leading-snug text-sm")}
                    >
                      <UserPlus className='size-4 shrink-0 text-neutral-500' strokeWidth={2} aria-hidden />
                      Set your referrer
                    </h2>

                    <div
                      className={cn(
                        STAKING_BALANCE_LIQUID_CARD,
                        "relative mt-2 min-w-0 overflow-hidden p-0"
                      )}
                    >
                      <Textarea
                        value={editDraft}
                        onChange={e => {
                          setEditDraft(e.target.value)
                          setEditFieldError(null)
                        }}
                        placeholder='Paste link or wallet address…'
                        rows={2}
                        className={STAKING_TEXTAREA}
                        autoComplete='off'
                        spellCheck={false}
                      />
                      <div className='absolute bottom-2 inset-e-2 z-10'>
                        <button
                          type='button'
                          disabled={!referrerEditDirty || saveReferrerBusy}
                          aria-busy={saveReferrerBusy}
                          aria-label={
                            saveReferrerBusy ? "Saving referrer" : "Save referrer"
                          }
                          className={cn(
                            referrerEditDirty
                              ? referrerSaveFabActiveClass
                              : referrerSaveFabIdleClass
                          )}
                          onClick={() => void confirmEditReferrer()}
                        >
                          {saveReferrerBusy ? (
                            <Loader2
                              className='size-4 shrink-0 motion-reduce:animate-none animate-referrer-save-swing'
                              strokeWidth={2}
                              aria-hidden
                            />
                          ) : (
                            <Save className='size-4' strokeWidth={2} aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>

                    {editFieldError ? (
                      <p
                        className='mt-2 px-1 text-center text-[13px] leading-snug text-[#ff4b42]'
                        role='alert'
                      >
                        {editFieldError}
                      </p>
                    ) : null}

                    <div className='mt-4 flex flex-col gap-2.5'>
                      {referralAddress ? (
                        <GlowingButton
                          type='button'
                          className='w-full rounded-full'
                          buttonClassName={referralModalGlowOutlineButtonClass}
                          size='lg'
                          variant='outline'
                          onClick={() => setConfirmDelete(true)}
                        >
                          Remove referrer
                        </GlowingButton>
                      ) : null}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StakingAppReferral
