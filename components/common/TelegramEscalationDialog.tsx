import GlowingButton from "@/components/common/glowingButton"
import { STAKING_COLUMN_LIQUID_PANEL } from "@/components/pages/staking/stakingGlassPanel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/staking-dialog"
import {
  STAKING_MODAL_ELEVATION_SHEET,
  STAKING_MODAL_OVERLAY_GLASS_BASE,
  STAKING_MODAL_PADDING_CONTENT,
  STAKING_MODAL_RADIUS_SHEET_BOTTOM_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_TOP_MAX_SM,
  STAKING_MODAL_SAFE_AREA_BOTTOM,
  STAKING_MODAL_SHEET_DESKTOP_PLACEMENT,
  STAKING_MODAL_SHEET_HANDLE_BAR,
  STAKING_MODAL_SHEET_HANDLE_STRIP_ROW,
  STAKING_MODAL_SHEET_INSET_MAX_SM,
  STAKING_MODAL_SHEET_SLIDE_ANIM_MAX_SM,
  STAKING_MODAL_SPACING_HEADER_TIGHT,
  STAKING_MODAL_TYPE_SHEET_DESCRIPTION,
  STAKING_MODAL_TYPE_SHEET_TITLE,
  STAKING_MODAL_WIDTH_SHEET_SM,
} from "@/constants/stakingModalSpec"
import {
  ChromeBrandIcon,
  MetaMaskBrandIcon,
  PhantomBrandIcon,
  SafariBrandIcon,
  TrustWalletBrandIcon,
} from "@/components/common/walletBrowserBrandIcons"
import { getTelegramWebApp } from "@/lib/mobile/browserEnvironment"
import { cn } from "@/lib/utils"
import { AlertTriangle, ExternalLink, X } from "lucide-react"
import { useCallback } from "react"

/** Overlapping avatar row indicating recommended browsers / wallet browsers. */
const SUPPORTED_BRAND_TILES: ReadonlyArray<{
  id: string
  label: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
}> = [
  { id: "safari", label: "Safari", Icon: SafariBrandIcon },
  { id: "chrome", label: "Chrome", Icon: ChromeBrandIcon },
  { id: "trust", label: "Trust Wallet", Icon: TrustWalletBrandIcon },
  { id: "metamask", label: "MetaMask", Icon: MetaMaskBrandIcon },
  { id: "phantom", label: "Phantom", Icon: PhantomBrandIcon },
]

/**
 * Telegram unsupported-environment notice.
 *
 * Preserved URL (session + localStorage) is used for `Telegram.WebApp.openLink`
 * when available so referral query and hash survive hand-off.
 */

const iosSheetEmphasis = "font-semibold text-neutral-800"

const telegramDialogShellClass = cn(
  STAKING_COLUMN_LIQUID_PANEL,
  "gap-0 overflow-hidden border-0 p-0 font-sans",
  STAKING_MODAL_ELEVATION_SHEET,
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
  STAKING_MODAL_SHEET_INSET_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_TOP_MAX_SM,
  STAKING_MODAL_RADIUS_SHEET_BOTTOM_MAX_SM,
  STAKING_MODAL_SHEET_SLIDE_ANIM_MAX_SM,
  STAKING_MODAL_SAFE_AREA_BOTTOM,
  STAKING_MODAL_WIDTH_SHEET_SM,
  STAKING_MODAL_SHEET_DESKTOP_PLACEMENT
)

const escalationGlowTallShell =
  "w-full justify-center rounded-full px-6 py-0 font-mono text-base min-h-12 h-12 sm:min-h-10 sm:h-10 sm:text-sm"

const escalationPrimaryButtonClass = cn(
  escalationGlowTallShell,
  "border-0 bg-neutral-900 text-white shadow-none hover:bg-neutral-900/90"
)

const escalationOutlineButtonClass = cn(
  escalationGlowTallShell,
  "border border-neutral-300 bg-white text-neutral-900 shadow-xs hover:bg-neutral-100"
)

export type TelegramEscalationDialogProps = {
  open: boolean
  /** Full absolute URL captured from `window.location.href` on staking routes. */
  preservedAbsoluteUrl: string | null
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function TelegramEscalationDialog({
  open,
  preservedAbsoluteUrl,
  onOpenChange,
  onClose,
}: TelegramEscalationDialogProps) {
  const openLinkTarget = preservedAbsoluteUrl ?? ""
  const canOpenPreservedUrl = Boolean(openLinkTarget)

  const telegramWebApp = getTelegramWebApp()
  const canOpenInExternalBrowser = Boolean(
    telegramWebApp?.openLink && canOpenPreservedUrl
  )

  const handleOpenInBrowser = useCallback(() => {
    if (!telegramWebApp?.openLink || !canOpenPreservedUrl) return
    telegramWebApp.openLink(openLinkTarget, { try_instant_view: false })
  }, [telegramWebApp, canOpenPreservedUrl, openLinkTarget])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName={STAKING_MODAL_OVERLAY_GLASS_BASE}
        className={telegramDialogShellClass}
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
            <div
              aria-hidden
              className={cn(
                "mx-auto mb-3 flex size-14 items-center justify-center rounded-full",
                "border border-white/65 bg-linear-to-b from-white/65 via-white/40 to-white/25",
                "shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-1px_0_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.35)]"
              )}
            >
              <AlertTriangle
                className='size-7 text-amber-500/90'
                strokeWidth={1.85}
              />
            </div>
            <DialogTitle className={STAKING_MODAL_TYPE_SHEET_TITLE}>
              Telegram isn&apos;t supported.
            </DialogTitle>
            <DialogDescription
              className={cn(STAKING_MODAL_TYPE_SHEET_DESCRIPTION, "pt-1.5")}
            >
                Open the website or link you tapped in your phone&apos;s{" "}
                <span className={iosSheetEmphasis}>browser</span>, or in your{" "}
                <span className={iosSheetEmphasis}>wallet browser</span>.
                {canOpenInExternalBrowser ? (
                  <>
                    {" "}
                    Use{" "}
                    <span className={iosSheetEmphasis}>Open in browser</span> so
                    referral parameters stay on the link.
                  </>
                ) : (
                  <>
                    {" "}
                    Use your browser&apos;s address bar or share sheet so the full
                    link, including referrals, is preserved.
                  </>
                )}
            </DialogDescription>

            <div
              className='mt-3 flex items-center justify-center'
              aria-label='Supported browsers and wallet browsers'
              role='img'
            >
              {SUPPORTED_BRAND_TILES.map(({ id, label, Icon }, index) => (
                <span
                  key={id}
                  title={label}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full bg-white",
                    "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.18),0_0_0_2px_rgba(255,255,255,0.95)]",
                    index === 0 ? "" : "-ml-2"
                  )}
                  style={{ zIndex: SUPPORTED_BRAND_TILES.length - index }}
                >
                  <Icon
                    className='size-5'
                    aria-hidden='true'
                    focusable='false'
                  />
                  <span className='sr-only'>{label}</span>
                </span>
              ))}
            </div>
          </DialogHeader>

          <div className='mt-5 flex flex-col gap-2.5'>
            {canOpenInExternalBrowser ? (
              <GlowingButton
                type='button'
                className='w-full rounded-full'
                buttonClassName={escalationOutlineButtonClass}
                size='lg'
                variant='outline'
                disabled={!canOpenPreservedUrl}
                onClick={handleOpenInBrowser}
              >
                <ExternalLink
                  className='size-4 shrink-0'
                  strokeWidth={2}
                  aria-hidden
                />
                <span>Open in browser</span>
              </GlowingButton>
            ) : null}
            <GlowingButton
              type='button'
              className='w-full rounded-full'
              buttonClassName={escalationPrimaryButtonClass}
              size='lg'
              variant='default'
              onClick={onClose}
            >
              <X className='size-4 shrink-0' strokeWidth={2} aria-hidden />
              <span>Close</span>
            </GlowingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
