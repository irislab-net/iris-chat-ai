"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatComposerLiquidSheetRowActiveClass,
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { mentionTokenForTool } from "@/lib/chat/composer-mentions"
import { cn } from "@/lib/utils"

const SIGNAL_EXAMPLE_ASSETS = [
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "XAU", name: "Gold" },
] as const

type SignalAsset = (typeof SIGNAL_EXAMPLE_ASSETS)[number]["symbol"]

type SignalGuidanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Insert a ready-to-send example into the composer. */
  onUseExample: (draft: string) => void
}

function buildSignalExample(label: string, asset: string): string {
  return `${mentionTokenForTool("signal", label).trimEnd()} ${asset}`
}

function SignalGuidanceBody({
  signalLabel,
  selectedAsset,
  onSelectAsset,
}: {
  signalLabel: string
  selectedAsset: SignalAsset
  onSelectAsset: (asset: SignalAsset) => void
}) {
  const t = useTranslations("workspace.signalGuidance")
  const token = mentionTokenForTool("signal", signalLabel).trimEnd()

  return (
    <div className="space-y-4">
      <div
        className={cn(
          chatMobileSheetCardClass,
          "flex items-center gap-3 py-3.5"
        )}
      >
        <MarketAssetLogo
          symbol={selectedAsset}
          className="size-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75)]"
          imageClassName="opacity-80 grayscale dark:opacity-85 dark:invert"
          size={40}
        />
        <p
          className="min-w-0 flex-1 text-[15px] font-medium tracking-[-0.016em] text-foreground"
          dir="ltr"
        >
          <span className="font-semibold text-[#2563EB] dark:text-[#93C5FD]">
            {token}
          </span>
          <span className="ms-1.5 font-semibold tabular-nums">
            {selectedAsset}
          </span>
        </p>
      </div>

      <div className="space-y-1.5">
        <p className={cn(chatMobileSheetSectionLabelClass, "px-3.5")}>
          {t("pickMarket")}
        </p>
        <div
          className="flex flex-col gap-1.5"
          role="radiogroup"
          aria-label={t("pickMarket")}
        >
          {SIGNAL_EXAMPLE_ASSETS.map((asset) => {
            const selected = asset.symbol === selectedAsset
            return (
              <Button
                key={asset.symbol}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={selected}
                className={cn(
                  chatComposerLiquidSheetRowClass,
                  "h-auto min-h-14 justify-start gap-3.5 px-3.5 py-3 text-[15px] font-medium tracking-[-0.016em] whitespace-normal hover:bg-white/58 dark:hover:bg-white/12",
                  selected && chatComposerLiquidSheetRowActiveClass
                )}
                onClick={() => onSelectAsset(asset.symbol)}
              >
                <span
                  className={cn(
                    chatComposerLiquidSheetRowIconClass,
                    "overflow-hidden p-0"
                  )}
                >
                  <MarketAssetLogo
                    symbol={asset.symbol}
                    className="size-10 bg-transparent"
                    imageClassName="opacity-80 grayscale dark:opacity-85 dark:invert"
                    size={40}
                  />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <span className="block text-foreground">{asset.name}</span>
                  <span
                    className="block text-[13px] font-normal tracking-[-0.006em] text-muted-foreground"
                    dir="ltr"
                  >
                    {asset.symbol}
                  </span>
                </span>
                {selected ? <SelectionCheckBadge /> : <SelectionCheckSpacer />}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SignalGuidanceDialog({
  open,
  onOpenChange,
  onUseExample,
}: SignalGuidanceDialogProps) {
  const t = useTranslations("workspace.signalGuidance")
  const tw = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const signalLabel = tw("composerToolSignalLabel")
  const [selectedAsset, setSelectedAsset] = React.useState<SignalAsset>("ETH")

  React.useEffect(() => {
    if (open) setSelectedAsset("ETH")
  }, [open])

  if (isDesktop === null) return null

  const example = buildSignalExample(signalLabel, selectedAsset)

  function confirmExample() {
    onUseExample(example)
    onOpenChange(false)
  }

  const actions = (
    <>
      <Button
        type="button"
        className={cn(
          chatMobileSheetPrimaryButtonClass,
          isDesktop && "h-10! min-h-10"
        )}
        onClick={confirmExample}
      >
        {t("useExample")}
      </Button>
      <Button
        type="button"
        className={cn(
          chatMobileSheetSecondaryButtonClass,
          isDesktop && "h-10! min-h-10"
        )}
        onClick={() => onOpenChange(false)}
      >
        {t("gotIt")}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={chatDesktopDialogClass}
          showCloseButton
          gsapMotion
          open={open}
        >
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-1.5 space-y-0 text-start">
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </DialogHeader>
            <SignalGuidanceBody
              signalLabel={signalLabel}
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
            />
          </div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {actions}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(chatMobileSheetContentClass, "gap-0 border-0")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-1.5")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("title")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {t("description")}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-2")}>
          <SignalGuidanceBody
            signalLabel={signalLabel}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
          />
        </div>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2 pt-4")}>
            {actions}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { SignalGuidanceDialog }
