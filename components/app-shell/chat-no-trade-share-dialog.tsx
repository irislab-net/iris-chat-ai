"use client"

import * as React from "react"
import {
  CopyIcon,
  PauseCircleIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  chatDesktopDialogClass,
  chatMobileSheetContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { IosShareIcon } from "@/components/icons/ios-share-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  captureShareNodeToBlob,
  formatSignalShareDate,
  shareImageWithCaption,
  SIGNAL_SHARE_CARD_BG,
  signalShareBrandLogoSrc,
} from "@/lib/chat/signal-share-capture"
import {
  buildNoTradeShareText,
  noTradeShareFileName,
  SIGNAL_SHARE_SITE,
} from "@/lib/chat/signal-share"
import { cn } from "@/lib/utils"

type ChatNoTradeShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
}

function ActionRow({
  busy,
  copied,
  onCopyText,
  onShareImage,
  copyLabel,
  shareLabel,
  copiedLabel,
}: {
  busy: boolean
  copied: boolean
  onCopyText: () => void
  onShareImage: () => void
  copyLabel: string
  shareLabel: string
  copiedLabel: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className={cn(
          chatMobileSheetSecondaryButtonClass,
          "h-11! min-h-11 gap-1.5 text-[14px]"
        )}
        onClick={onCopyText}
      >
        <CopyIcon className="size-3.5" />
        {copied ? copiedLabel : copyLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        className={cn(
          chatMobileSheetPrimaryButtonClass,
          "h-11! min-h-11 gap-1.5 text-[14px]"
        )}
        onClick={onShareImage}
      >
        <IosShareIcon className="size-3.5" />
        {shareLabel}
      </Button>
    </div>
  )
}

function SharePreviewCard({
  reason,
  shareDate,
  captureRef,
}: {
  reason: string
  shareDate: string
  captureRef: React.RefObject<HTMLDivElement | null>
}) {
  const t = useTranslations("workspace")
  const text = reason.trim()
  const logoSrc = signalShareBrandLogoSrc()

  return (
    <div
      ref={captureRef}
      className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.35rem] text-[#0f172a] shadow-[0_12px_40px_-18px_rgba(15,23,42,0.28)]"
      style={{
        colorScheme: "light",
        backgroundColor: SIGNAL_SHARE_CARD_BG,
        backgroundImage:
          "radial-gradient(120% 80% at 0% 0%, rgba(245,158,11,0.18), transparent 55%), radial-gradient(90% 60% at 100% 0%, rgba(37,99,235,0.1), transparent 50%)",
      }}
    >
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-[-0.03em]">
              {t("noTradeTitle")}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/12 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                <ShieldCheckIcon className="size-3 shrink-0 opacity-80" aria-hidden />
                {t("noTradeCapitalProtected")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/16 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
                <PauseCircleIcon className="size-3 shrink-0 opacity-80" aria-hidden />
                {t("noTradeBadge")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-4">
        <div className="rounded-2xl bg-white px-3.5 py-3">
          <p className="text-[10px] font-medium tracking-[0.08em] text-black/45 uppercase">
            {t("noTradeReasonHeading")}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-black/75">
            {text}
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-black/6 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- capture-safe raster logo */}
          <img
            src={logoSrc}
            alt=""
            width={28}
            height={28}
            decoding="sync"
            className="size-7 shrink-0 rounded-full"
          />
          <span className="text-[13px] font-semibold tracking-tight">Exur</span>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[11px] font-medium tracking-tight text-black/50">
            {shareDate}
          </p>
          <p className="text-[12px] font-medium tracking-tight text-black/45">
            {SIGNAL_SHARE_SITE}
          </p>
        </div>
      </footer>
    </div>
  )
}

function ChatNoTradeShareDialog({
  open,
  onOpenChange,
  reason,
}: ChatNoTradeShareDialogProps) {
  const t = useTranslations("workspace")
  const locale = useLocale()
  const isDesktop = useIsDesktop()
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const captureRef = React.useRef<HTMLDivElement | null>(null)
  const copiedTimerRef = React.useRef(0)

  const shareDate = React.useMemo(
    () => formatSignalShareDate(locale),
    [locale]
  )

  const shareText = React.useMemo(
    () =>
      buildNoTradeShareText(
        reason,
        {
          title: t("noTradeTitle"),
          badge: t("noTradeBadge"),
          capitalProtected: t("noTradeCapitalProtected"),
          reasonHeading: t("noTradeReasonHeading"),
        },
        { date: shareDate }
      ),
    [reason, shareDate, t]
  )

  const shareTitle = `${t("noTradeTitle")} · Exur`

  React.useEffect(() => {
    return () => window.clearTimeout(copiedTimerRef.current)
  }, [])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setBusy(false)
      setCopied(false)
    } else {
      toast.dismiss()
    }
    onOpenChange(next)
  }

  function flashCopied() {
    toast.dismiss()
    setCopied(true)
    window.clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1_600)
  }

  async function onCopyText() {
    if (busy) return
    setBusy(true)
    try {
      await navigator.clipboard.writeText(shareText)
      flashCopied()
    } catch {
      toast.error(t("signalShareCopyFailed"))
    } finally {
      setBusy(false)
    }
  }

  async function onShareImage() {
    if (busy) return
    setBusy(true)
    try {
      const node = captureRef.current
      if (!node) throw new Error("preview-missing")
      const blob = await captureShareNodeToBlob(node)
      try {
        const result = await shareImageWithCaption({
          blob,
          fileName: noTradeShareFileName(),
          title: shareTitle,
          text: shareText,
        })
        if (result.kind !== "shared") {
          flashCopied()
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        throw error
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error(t("signalShareShareFailed"))
    } finally {
      setBusy(false)
    }
  }

  if (isDesktop === null) return null

  const shareHeading = t("share")

  const header = isDesktop ? (
    <DialogHeader className="shrink-0 gap-0 space-y-0 px-5 pt-5 pb-3 text-start">
      <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
        {shareHeading}
      </DialogTitle>
      <DialogDescription className="sr-only">{shareHeading}</DialogDescription>
    </DialogHeader>
  ) : (
    <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 gap-0")}>
      <SheetTitle className={chatMobileSheetTitleClass}>{shareHeading}</SheetTitle>
      <SheetDescription className="sr-only">{shareHeading}</SheetDescription>
    </SheetHeader>
  )

  const actionRow = (
    <ActionRow
      busy={busy}
      copied={copied}
      onCopyText={onCopyText}
      onShareImage={onShareImage}
      copyLabel={t("signalShareCopyText")}
      shareLabel={t("signalShareShareImage")}
      copiedLabel={t("signalShareCopied")}
    />
  )

  const preview = (
    <div className="rounded-[1.5rem] bg-foreground/[0.03] p-3 dark:bg-white/[0.04]">
      <SharePreviewCard
        reason={reason}
        shareDate={shareDate}
        captureRef={captureRef}
      />
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "flex max-h-[min(85dvh,720px)] flex-col gap-0 overflow-hidden sm:max-w-[26rem]"
          )}
          showCloseButton
          gsapMotion
          open={open}
        >
          {header}
          <div className="min-h-0 flex-1 overflow-y-auto px-5">{preview}</div>
          <div className="shrink-0 bg-transparent px-5 pt-3 pb-5">{actionRow}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(
          chatMobileSheetContentClass,
          "flex flex-col gap-0 overflow-hidden border-0"
        )}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{preview}</div>
        <div
          className={cn(
            chatMobileSheetFooterBarClass,
            "shrink-0 !bg-transparent shadow-none backdrop-blur-none"
          )}
        >
          {actionRow}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { ChatNoTradeShareDialog }
