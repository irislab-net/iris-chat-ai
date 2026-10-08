/**
 * This is the ONLY **consent** modal in the staking flow (terms acceptance).
 * Transaction progress uses `TransactionStatusSurface` separately — that
 * transaction modal is explicitly allowed alongside this consent surface.
 *
 * Do not add other consent dialogs or tooltip-only substitutes for required copy;
 * reasons / hints / errors must still render as visible text where applicable.
 */

import GlowingButton from "@/components/common/glowingButton"
import { useStakingTermsConsent } from "@/components/pages/staking/useStakingTermsConsent"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/staking-dialog"
import { STAKING_MODAL_TITLE_ICON_CLASS } from "@/constants/stakingModalSpec"
import { cn } from "@/lib/utils"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ShieldCheck } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { STAKING_BALANCE_LIQUID_CARD } from "./stakingGlassPanel"

/** Same tap target as deposit CTA + referral modals: 48px min on small viewports, 40px on sm+. */
const consentGlowTallShell =
  "w-full justify-center rounded-full px-6 py-0 font-mono text-base min-h-12 h-12 sm:min-h-10 sm:h-10 sm:text-sm sm:w-auto disabled:opacity-70"

const consentGlowPrimaryClass = cn(
  consentGlowTallShell,
  "border-0 bg-[#2563EB]/88 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.42),0_4px_16px_-4px_rgba(37,99,235,0.28)] hover:bg-[#2563EB]/96"
)

const consentGlowOutlineClass = cn(
  consentGlowTallShell,
  "border border-white/55 bg-white/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md hover:bg-white/90 dark:border-white/16 dark:bg-white/10 dark:hover:bg-white/14"
)

/**
 * Staking terms: centered modal on desktop, bottom sheet on small viewports.
 * Uses `modal={false}` so Radix does not apply its own body scroll lock; we use the same
 * `document.body.style.overflowY` pattern as the navbar.
 */
export function StakingTermsConsentSurface() {
  const { dialogOpen, onDialogOpenChange, acceptTerms, termsUrl } =
    useStakingTermsConsent()

  const externalTermsUrl = termsUrl.trim()

  return (
    <Dialog
      modal={false}
      open={dialogOpen}
      onOpenChange={open => {
        if (open) onDialogOpenChange(true)
      }}
    >
      {dialogOpen ? (
        <DialogPrimitive.Portal>
          <div
            role='presentation'
            aria-hidden
            className='animate-in fade-in-0 fixed inset-0 z-59 bg-black/50 duration-200'
          />
        </DialogPrimitive.Portal>
      ) : null}
      <DialogContent
        showCloseButton={false}
        includeOverlay={false}
        onPointerDownOutside={event => {
          event.preventDefault()
        }}
        onInteractOutside={event => {
          event.preventDefault()
        }}
        onEscapeKeyDown={event => {
          event.preventDefault()
        }}
        className={cn(
          STAKING_BALANCE_LIQUID_CARD, "z-60 duration-200 sm:gap-6",
          "max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[90dvh] max-md:max-w-full max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-4xl max-md:rounded-b-none max-md:border-b-0 max-md:overflow-y-auto max-md:data-[state=open]:slide-in-from-bottom-2 max-md:data-[state=closed]:slide-out-to-bottom"
        )}
      >
        <DialogHeader className='space-y-3 text-left sm:text-left'>
          <DialogTitle className='text-xl font-semibold leading-snug tracking-tight text-foreground'>
            <div className="flex items-center justify-center">
              <span className="w-12 rounded-full bg-neutral-200 h-2"></span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mt-6">
                <ShieldCheck className={STAKING_MODAL_TITLE_ICON_CLASS} strokeWidth={2} aria-hidden />
                Accept Staking Terms
              </div>

              <p className='text-[15px] leading-relaxed text-neutral-500 font-light px-1'>
                To start staking or withdrawing, you need to accept the staking terms.
              </p>
            </div>

          </DialogTitle>
          <DialogDescription className="sr-only">
            Staking terms consent details
          </DialogDescription>
          <div className="space-y-4 text-pretty text-base leading-relaxed">
              <ol className='list-none space-y-3 ps-0'>
                <li className='flex gap-3 text-[15px] font-light leading-relaxed text-neutral-600'>
                  <span
                    className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600'
                    aria-hidden
                  >
                    1
                  </span>
                  <span>
                    Tap{" "}
                    {externalTermsUrl ? (
                      <a
                        href={externalTermsUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-normal text-neutral-900 underline decoration-neutral-400 underline-offset-[3px] transition-colors hover:text-neutral-700'
                      >
                        Staking Terms
                      </a>
                    ) : (
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-neutral-900 underline decoration-neutral-400 underline-offset-[3px] transition-colors hover:text-neutral-700"
                      >
                        Staking Terms
                      </Link>
                    )}{" "}
                    to read them.
                  </span>
                </li>
                <li className='flex gap-3 text-[15px] font-light leading-relaxed text-neutral-600'>
                  <span
                    className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600'
                    aria-hidden
                  >
                    2
                  </span>
                  <span>
                    Then tap <span className='font-normal text-neutral-900'>&quot;Accept&quot;</span>{" "}
                    to continue.
                  </span>
                </li>
                <li className='flex gap-3 text-[15px] font-light leading-relaxed text-neutral-600'>
                  <span
                    className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600'
                    aria-hidden
                  >
                    3
                  </span>
                  <span>
                    You can tap <span className='font-normal text-neutral-900'>&quot;Cancel&quot;</span>{" "}
                    and come back anytime.
                  </span>
                </li>
              </ol>
          </div>
        </DialogHeader>

        <DialogFooter className='mt-1 flex w-full flex-col gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-3'>
          <GlowingButton
            type='button'
            variant='outline'
            size='lg'
            className='w-full rounded-full sm:w-auto'
            buttonClassName={consentGlowOutlineClass}
            onClick={() => onDialogOpenChange(false)}
          >
            Cancel
          </GlowingButton>

          <GlowingButton
            type='button'
            variant='default'
            size='lg'
            className='w-full rounded-full sm:w-auto'
            buttonClassName={consentGlowPrimaryClass}
            onClick={() => acceptTerms()}
          >
            Accept
          </GlowingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
