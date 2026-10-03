"use client"

import * as React from "react"
import { TrendingUpIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
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
import {
  COMPOSER_MENTION_TRIGGER,
  mentionTokenForTool,
} from "@/lib/chat/composer-mentions"
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
  onPick,
}: {
  signalLabel: string
  onPick: (draft: string) => void
}) {
  const t = useTranslations("workspace.signalGuidance")

  return (
    <div className="space-y-3">
      <div className={cn(chatMobileSheetCardClass, "flex items-start gap-3")}>
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground dark:bg-white/8">
          <TrendingUpIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-[13px] font-medium leading-snug text-foreground">
            {t("tipTitle")}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {t("tipBody", {
              trigger: COMPOSER_MENTION_TRIGGER,
              signal: signalLabel,
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className={chatMobileSheetSectionLabelClass}>{t("examplesLabel")}</p>
        <div className="grid grid-cols-2 gap-2">
          {SIGNAL_EXAMPLE_ASSETS.map((asset) => {
            const draft = buildSignalExample(signalLabel, asset)
            return (
              <button
                key={asset}
                type="button"
                className={cn(
                  chatMobileSheetCardClass,
                  "text-start transition-[transform,background-color] active:scale-[0.98] hover:bg-foreground/4 dark:hover:bg-white/10"
                )}
                onClick={() => onPick(draft)}
              >
                <span className="block truncate font-mono text-[13px] font-semibold tracking-tight text-primary">
                  {draft}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {t("exampleHint", { asset })}
                </span>
              </button>
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

  if (isDesktop === null) return null

  function pickExample(draft: string) {
    onUseExample(draft)
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
        onClick={() => pickExample(buildSignalExample(signalLabel, "ETH"))}
      >
        {t("tryEth")}
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
            <DialogHeader className="gap-2 space-y-0 text-start">
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </DialogHeader>
            <SignalGuidanceBody
              signalLabel={signalLabel}
              onPick={pickExample}
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
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-2")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("title")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {t("description")}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1 pb-5")}>
          <SignalGuidanceBody signalLabel={signalLabel} onPick={pickExample} />
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
