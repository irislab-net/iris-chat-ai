"use client"

import * as React from "react"
import {
  CheckCircle2Icon,
  ClipboardPasteIcon,
  DollarSignIcon,
  Loader2Icon,
  ScanLineIcon,
  WalletIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileGlassSurfaceClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { useIsDesktop } from "@/hooks/use-media-query"
import { useMockWithdrawFlow } from "@/lib/desk-mock/hooks"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const withdrawFieldShellClass = cn(
  chatMobileGlassSurfaceClass,
  "rounded-2xl border-white/55",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-8px_16px_-12px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-10px_rgba(15,23,42,0.14)]",
  "dark:border-white/20 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.14),inset_0_-10px_20px_-12px_rgba(0,0,0,0.45),0_8px_24px_-10px_rgba(0,0,0,0.42)]"
)

const fieldActionClass = cn(
  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full",
  "text-foreground/70 transition-colors",
  "hover:bg-white/50 hover:text-foreground active:scale-[0.96]",
  "dark:hover:bg-white/12"
)

type WalletWithdrawSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableUsd: number
}

function LiquidField({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(withdrawFieldShellClass, className)}>
      <span aria-hidden className={cn(landingGlassSheen, "rounded-2xl")} />
      {children}
    </div>
  )
}

function parseWalletAddress(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  const ethUri = text.match(/ethereum:(0x[a-fA-F0-9]{40})/i)
  if (ethUri?.[1]) return ethUri[1]
  const bare = text.match(/0x[a-fA-F0-9]{40}/)
  if (bare?.[0]) return bare[0]
  if (text.length >= 10) return text
  return null
}

type BarcodeDetectorLike = {
  detect: (
    source: ImageBitmapSource
  ) => Promise<Array<{ rawValue?: string }>>
}

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = (
    globalThis as unknown as {
      BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike
    }
  ).BarcodeDetector
  if (!Ctor) return null
  try {
    return new Ctor({ formats: ["qr_code"] })
  } catch {
    try {
      return new Ctor()
    } catch {
      return null
    }
  }
}

function WithdrawBody({
  availableUsd,
  onClose,
  footerClassName,
}: {
  availableUsd: number
  onClose: () => void
  footerClassName?: string
}) {
  const t = useTranslations("deskProfile")
  const { status, submit, reset } = useMockWithdrawFlow()
  const maxUsd = Math.max(0, availableUsd)
  const [amount, setAmount] = React.useState(() =>
    String(Math.min(250, maxUsd || 250))
  )
  const [address, setAddress] = React.useState("")
  const [fieldHint, setFieldHint] = React.useState<string | null>(null)
  const [scanning, setScanning] = React.useState(false)
  const scanInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  const amountNum = Number(amount)
  const sliderValue = Number.isFinite(amountNum)
    ? Math.min(Math.max(amountNum, 0), maxUsd || 0)
    : 0

  function setAmountFromNumber(next: number) {
    const clamped = Math.min(Math.max(next, 0), maxUsd || 0)
    setAmount(
      clamped.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 2,
      })
    )
  }

  async function onPasteAddress() {
    setFieldHint(null)
    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseWalletAddress(text)
      if (!parsed) {
        setFieldHint(t("withdrawPasteFailed"))
        return
      }
      setAddress(parsed)
    } catch {
      setFieldHint(t("withdrawPasteFailed"))
    }
  }

  async function onScanFile(file: File) {
    setFieldHint(null)
    const detector = getBarcodeDetector()
    if (!detector) {
      setFieldHint(t("withdrawScanUnsupported"))
      return
    }
    setScanning(true)
    try {
      const bitmap = await createImageBitmap(file)
      try {
        const codes = await detector.detect(bitmap)
        const raw = codes.map((c) => c.rawValue ?? "").find(Boolean) ?? ""
        const parsed = parseWalletAddress(raw)
        if (!parsed) {
          setFieldHint(t("withdrawScanFailed"))
          return
        }
        setAddress(parsed)
      } finally {
        bitmap.close()
      }
    } catch {
      setFieldHint(t("withdrawScanFailed"))
    } finally {
      setScanning(false)
    }
  }

  if (status === "submitted") {
    return (
      <>
        <div
          className={cn(
            chatMobileSheetBodyClass,
            "flex flex-col items-center gap-3 overflow-y-auto pt-5 text-center"
          )}
        >
          <CheckCircle2Icon className="size-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">{t("withdrawSubmitted")}</p>
          <p className="text-[13px] text-muted-foreground">
            {t("withdrawSubmittedHint")}
          </p>
        </div>
        <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-3 pb-0")}>
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={() => {
                reset()
                onClose()
              }}
            >
              {t("done")}
            </Button>
          </div>
        </div>
      </>
    )
  }

  const valid =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    amountNum <= maxUsd &&
    address.trim().length >= 10

  return (
    <>
      <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-5")}>
        <div className="flex flex-col gap-4">
          <div>
            <label
              className={cn(chatMobileSheetSectionLabelClass, "mb-2 block px-1")}
            >
              {t("withdrawAmount")}
            </label>
            <LiquidField className="flex items-center ps-3 pe-1.5">
              <DollarSignIcon
                className="relative z-10 size-4 shrink-0 stroke-[1.75] text-foreground/35"
                aria-hidden
              />
              <Input
                type="number"
                min={0}
                max={maxUsd || undefined}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                }}
                className="relative z-10 h-12 min-w-0 flex-1 border-0 bg-transparent ps-2 pe-3 shadow-none focus-visible:ring-0"
              />
            </LiquidField>
            <p className="mt-1.5 px-1 text-[12px] text-muted-foreground">
              {t("withdrawAvailable", {
                amount: maxUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              })}
            </p>
            <div className="mt-2 px-1">
              <Slider
                min={0}
                max={maxUsd > 0 ? maxUsd : 1}
                step={0.01}
                disabled={maxUsd <= 0}
                value={sliderValue}
                onValueChange={(next) => {
                  setAmountFromNumber(typeof next === "number" ? next : 0)
                }}
                aria-label={t("withdrawAmount")}
              />
            </div>
          </div>

          <div>
            <label
              className={cn(chatMobileSheetSectionLabelClass, "mb-2 block px-1")}
            >
              {t("withdrawAddress")}
            </label>
            <LiquidField className="flex items-center gap-0.5 ps-3 pe-1.5">
              <WalletIcon
                className="relative z-10 size-4 shrink-0 stroke-[1.75] text-foreground/35"
                aria-hidden
              />
              <Input
                value={address}
                onChange={(e) => {
                  setFieldHint(null)
                  setAddress(e.target.value)
                }}
                placeholder="0x…"
                className="relative z-10 h-12 min-w-0 flex-1 border-0 bg-transparent ps-2 pe-1.5 font-mono text-sm shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                className={fieldActionClass}
                aria-label={t("withdrawPaste")}
                title={t("withdrawPaste")}
                onClick={() => void onPasteAddress()}
              >
                <ClipboardPasteIcon className="size-4 stroke-[1.75]" />
              </button>
              <button
                type="button"
                className={fieldActionClass}
                aria-label={t("withdrawScan")}
                title={t("withdrawScan")}
                disabled={scanning}
                onClick={() => scanInputRef.current?.click()}
              >
                {scanning ? (
                  <Loader2Icon className="size-4 animate-spin stroke-[1.75]" />
                ) : (
                  <ScanLineIcon className="size-4 stroke-[1.75]" />
                )}
              </button>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) void onScanFile(file)
                }}
              />
            </LiquidField>
            {fieldHint ? (
              <p
                className="mt-1.5 px-1 text-[12px] text-destructive"
                role="status"
              >
                {fieldHint}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
        <div className={cn(chatMobileSheetFooterBarClass, "pt-3 pb-0")}>
          <Button
            type="button"
            className={chatMobileSheetPrimaryButtonClass}
            disabled={!valid || status === "submitting"}
            onClick={() => submit(amountNum, address.trim())}
          >
            {status === "submitting" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {t("withdrawSubmitting")}
              </>
            ) : (
              t("withdrawSubmit")
            )}
          </Button>
        </div>
      </div>
    </>
  )
}

function WalletWithdrawSheet({
  open,
  onOpenChange,
  availableUsd,
}: WalletWithdrawSheetProps) {
  const t = useTranslations("deskProfile")
  const isDesktop = useIsDesktop()
  const title = t("withdrawTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,40rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("withdrawIntro")}
            </DialogDescription>
          </DialogHeader>
          <WithdrawBody
            availableUsd={availableUsd}
            onClose={() => onOpenChange(false)}
            footerClassName="pb-2"
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={chatMobileSheetCompactContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 pe-5")}>
          <div className="flex items-center gap-2">
            <SheetTitle className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}>
              {title}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={() => onOpenChange(false)} />
          </div>
          <SheetDescription className="sr-only">
            {t("withdrawIntro")}
          </SheetDescription>
        </SheetHeader>
        <WithdrawBody
          availableUsd={availableUsd}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export { WalletWithdrawSheet }
