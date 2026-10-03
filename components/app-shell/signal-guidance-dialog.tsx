"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetChipActiveClass,
  chatMobileSheetChipClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { mentionTokenForTool } from "@/lib/chat/composer-mentions"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const SIGNAL_EXAMPLE_ASSETS = ["ETH", "BTC", "SOL", "XAU"] as const

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
  selectedAsset: (typeof SIGNAL_EXAMPLE_ASSETS)[number]
  onSelectAsset: (asset: (typeof SIGNAL_EXAMPLE_ASSETS)[number]) => void
}) {
  const t = useTranslations("workspace.signalGuidance")
  const token = mentionTokenForTool("signal", signalLabel).trimEnd()

  return (
    <div className={cn(chatMobileSheetCardClass, "space-y-3")}>
      <p
        className="font-mono text-[15px] font-semibold tracking-tight text-foreground"
        dir="ltr"
      >
        <span className="text-primary">{token}</span>
        <span> {selectedAsset}</span>
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("pickMarket")}
      >
        {SIGNAL_EXAMPLE_ASSETS.map((asset) => {
          const selected = asset === selectedAsset
          return (
            <Button
              key={asset}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={selected}
              className={cn(
                chatMobileSheetChipClass,
                selected && chatMobileSheetChipActiveClass
              )}
              onClick={() => onSelectAsset(asset)}
            >
              {asset}
            </Button>
          )
        })}
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
  const [selectedAsset, setSelectedAsset] =
    React.useState<(typeof SIGNAL_EXAMPLE_ASSETS)[number]>("ETH")

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
          isDesktop
            ? cn(landingCta("primary", "sm"), "rounded-full")
            : chatMobileSheetPrimaryButtonClass
        )}
        onClick={confirmExample}
      >
        {t("useExample")}
      </Button>
      <Button
        type="button"
        className={cn(
          isDesktop
            ? cn(landingCta("secondary", "sm"), "rounded-full")
            : chatMobileSheetSecondaryButtonClass
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
        <DialogContent className={chatDesktopDialogClass} showCloseButton>
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
          <SheetDescription
            className={cn(chatMobileSheetDescriptionClass, "text-[13px]")}
          >
            {t("description")}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-5")}>
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
