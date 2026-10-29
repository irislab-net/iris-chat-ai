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
import { WalletLiquidField } from "@/components/desk/wallet-liquid-field"
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
import { WalletQrScanner } from "@/components/desk/wallet-qr-scanner"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  createMeWithdrawal,
  createWithdrawalChallenge,
  fetchMeStableRoutes,
  preferStableRoute,
  type MeStableRoute,
} from "@/lib/api/wallet"
import { notifyDeskWalletChanged } from "@/lib/desk-events"
import { cn } from "@/lib/utils"

const NETWORKS = ["TRC20", "BEP20", "ERC20"] as const

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

function parseWalletAddress(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  const ethUri = text.match(/ethereum:(0x[a-fA-F0-9]{40})/i)
  if (ethUri?.[1]) return ethUri[1]
  const bare = text.match(/0x[a-fA-F0-9]{40}/)
  if (bare?.[0]) return bare[0]
  const tron = text.match(/\bT[1-9A-HJ-NP-Za-km-z]{33}\b/)
  if (tron?.[0]) return tron[0]
  if (text.length >= 10) return text
  return null
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "body" in err) {
    const body = (err as { body?: { error?: string } }).body
    if (body?.error) return body.error
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
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
  const maxUsd = Math.max(0, availableUsd)
  const [amount, setAmount] = React.useState(() =>
    String(Math.min(250, maxUsd || 0))
  )
  const [address, setAddress] = React.useState("")
  const [network, setNetwork] = React.useState("TRC20")
  const [routes, setRoutes] = React.useState<MeStableRoute[]>([])
  const [code, setCode] = React.useState("")
  const [step, setStep] = React.useState<"form" | "code" | "done">("form")
  const [submitting, setSubmitting] = React.useState(false)
  const [fieldHint, setFieldHint] = React.useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const [scanningFile, setScanningFile] = React.useState(false)
  const scanInputRef = React.useRef<HTMLInputElement>(null)
  const addressInputRef = React.useRef<HTMLInputElement>(null)
  const pendingPasteCleanupRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const next = await fetchMeStableRoutes()
        if (cancelled) return
        setRoutes(next)
        const preferred = preferStableRoute(next, "USDT", "TRC20")
        if (preferred) setNetwork(preferred.network)
      } catch {
        if (!cancelled) setFieldHint(t("withdrawError"))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const availableNetworks = React.useMemo(() => {
    const set = new Set(
      routes
        .filter((route) => route.enabled && route.token.toUpperCase() === "USDT")
        .map((route) => route.network.toUpperCase())
    )
    return NETWORKS.filter((name) => set.has(name))
  }, [routes])

  const activeNetwork =
    availableNetworks.length > 0 &&
    !availableNetworks.includes(network as (typeof NETWORKS)[number])
      ? availableNetworks[0]!
      : network

  const selectedRoute = preferStableRoute(routes, "USDT", activeNetwork)
  const amountNum = Number(amount)
  const sliderValue = Number.isFinite(amountNum)
    ? Math.min(Math.max(amountNum, 0), maxUsd || 0)
    : 0

  function setAmountFromNumber(next: number) {
    const clamped = Math.min(Math.max(next, 0), maxUsd || 0)
    setAmount(
      clamped.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 6,
      })
    )
  }

  function armManualPasteFallback() {
    pendingPasteCleanupRef.current?.()
    const input = addressInputRef.current
    if (!input) {
      setFieldHint(t("withdrawPasteManual"))
      return
    }
    window.focus()
    input.focus()
    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text") ?? ""
      const parsed = parseWalletAddress(text)
      // #region agent log
      fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "b499a2",
        },
        body: JSON.stringify({
          sessionId: "b499a2",
          runId: "post-fix",
          hypothesisId: "E",
          location: "wallet-withdraw-sheet.tsx:armManualPasteFallback",
          message: "native paste event",
          data: {
            length: text.length,
            parsedOk: Boolean(parsed),
            preview: text.trim().slice(0, 6),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      try {
        const prev = JSON.parse(sessionStorage.getItem("debug-b499a2-paste") || "[]")
        prev.push({
          hypothesisId: "E",
          message: "native paste event",
          data: { length: text.length, parsedOk: Boolean(parsed) },
          timestamp: Date.now(),
        })
        sessionStorage.setItem("debug-b499a2-paste", JSON.stringify(prev.slice(-20)))
      } catch { /* ignore */ }
      // #endregion
      if (!parsed) {
        setFieldHint(t("withdrawPasteFailed"))
        return
      }
      event.preventDefault()
      setFieldHint(null)
      setAddress(parsed)
      pendingPasteCleanupRef.current?.()
      pendingPasteCleanupRef.current = null
    }
    input.addEventListener("paste", onPaste)
    pendingPasteCleanupRef.current = () => {
      input.removeEventListener("paste", onPaste)
    }
    setFieldHint(t("withdrawPasteManual"))
  }

  React.useEffect(() => {
    return () => {
      pendingPasteCleanupRef.current?.()
      pendingPasteCleanupRef.current = null
    }
  }, [])

  async function onPasteAddress() {
    setFieldHint(null)
    pendingPasteCleanupRef.current?.()
    pendingPasteCleanupRef.current = null
    // #region agent log
    const __dbg = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
      const payload = {
        sessionId: "b499a2",
        runId: "post-fix",
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }
      try {
        const prev = JSON.parse(sessionStorage.getItem("debug-b499a2-paste") || "[]")
        prev.push(payload)
        sessionStorage.setItem("debug-b499a2-paste", JSON.stringify(prev.slice(-20)))
      } catch { /* ignore */ }
      fetch("http://127.0.0.1:7371/ingest/8d665b6d-4a70-4998-b969-c5182d9c6538", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "b499a2",
        },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }
    try {
      window.focus()
      addressInputRef.current?.focus()
    } catch { /* ignore */ }
    __dbg("A", "wallet-withdraw-sheet.tsx:onPasteAddress:entry", "paste clicked", {
      isSecureContext: window.isSecureContext,
      hasClipboard: Boolean(navigator.clipboard),
      hasReadText: typeof navigator.clipboard?.readText === "function",
      visibility: document.visibilityState,
      hasFocus: document.hasFocus(),
      inputFocused: document.activeElement === addressInputRef.current,
    })
    // #endregion
    try {
      if (!navigator.clipboard?.readText) {
        // #region agent log
        __dbg("B", "wallet-withdraw-sheet.tsx:onPasteAddress:no-api", "clipboard readText missing", {})
        // #endregion
        armManualPasteFallback()
        return
      }
      const text = await navigator.clipboard.readText()
      const trimmed = text.trim()
      const parsed = parseWalletAddress(text)
      // #region agent log
      __dbg("C", "wallet-withdraw-sheet.tsx:onPasteAddress:parsed", "clipboard read succeeded", {
        length: text.length,
        trimmedLength: trimmed.length,
        startsWith0x: trimmed.toLowerCase().startsWith("0x"),
        startsWithT: trimmed.startsWith("T"),
        looksEth: /^0x[a-fA-F0-9]{40}$/.test(trimmed),
        looksTron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed),
        parsedOk: Boolean(parsed),
        preview: trimmed.slice(0, 6),
      })
      // #endregion
      if (!parsed) {
        setFieldHint(t("withdrawPasteFailed"))
        return
      }
      setAddress(parsed)
    } catch (err) {
      // #region agent log
      __dbg("D", "wallet-withdraw-sheet.tsx:onPasteAddress:catch", "clipboard read threw; arming fallback", {
        name: err instanceof Error ? err.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
      })
      // #endregion
      armManualPasteFallback()
    }
  }

  const applyScannedRaw = React.useCallback(
    (raw: string) => {
      const parsed = parseWalletAddress(raw)
      if (!parsed) {
        setFieldHint(t("withdrawScanFailed"))
        return false
      }
      setFieldHint(null)
      setAddress(parsed)
      return true
    },
    [t]
  )

  const onCameraDetected = React.useCallback(
    (raw: string) => {
      if (!applyScannedRaw(raw)) return
      setCameraOpen(false)
    },
    [applyScannedRaw]
  )

  async function onScanFile(file: File) {
    setFieldHint(null)
    setScanningFile(true)
    try {
      const { getBarcodeDetector } = await import(
        "@/components/desk/wallet-qr-scanner"
      )
      const detector = getBarcodeDetector()
      if (!detector) {
        setFieldHint(t("withdrawScanUnsupported"))
        return
      }
      const bitmap = await createImageBitmap(file)
      try {
        const codes = await detector.detect(bitmap)
        const raw = codes.map((c) => c.rawValue ?? "").find(Boolean) ?? ""
        if (!applyScannedRaw(raw)) {
          setFieldHint(t("withdrawScanFailed"))
        }
      } finally {
        bitmap.close()
      }
    } catch {
      setFieldHint(t("withdrawScanFailed"))
    } finally {
      setScanningFile(false)
    }
  }

  const formValid =
    Boolean(selectedRoute) &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    amountNum <= maxUsd &&
    address.trim().length >= 10

  async function onRequestChallenge() {
    if (!formValid || !selectedRoute) return
    setSubmitting(true)
    setFieldHint(null)
    try {
      await createWithdrawalChallenge()
      setStep("code")
    } catch (err) {
      setFieldHint(apiErrorMessage(err, t("withdrawError")))
    } finally {
      setSubmitting(false)
    }
  }

  async function onConfirmWithdrawal() {
    if (!selectedRoute || code.trim().length < 4) return
    setSubmitting(true)
    setFieldHint(null)
    try {
      await createMeWithdrawal({
        route: selectedRoute.code,
        destinationAddress: address.trim(),
        amountUsd: amountNum,
        code: code.trim(),
      })
      notifyDeskWalletChanged()
      setStep("done")
    } catch (err) {
      setFieldHint(apiErrorMessage(err, t("withdrawError")))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "done") {
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
              onClick={onClose}
            >
              {t("done")}
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (step === "code") {
    return (
      <>
        <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-5")}>
          <div className="flex flex-col gap-4">
            <p className="px-3 text-[13px] text-muted-foreground">
              {t("withdrawCodeHint")}
            </p>
            <div>
              <label
                className={cn(
                  chatMobileSheetSectionLabelClass,
                  "mb-2 block px-3"
                )}
                htmlFor="desk-withdraw-code"
              >
                {t("withdrawCode")}
              </label>
              <WalletLiquidField className="flex items-center px-3">
                <Input
                  id="desk-withdraw-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    setFieldHint(null)
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }}
                  className="relative z-10 h-12 min-w-0 flex-1 border-0 bg-transparent tracking-[0.3em] text-[16px]! shadow-none focus-visible:ring-0 max-md:text-[16px]!"
                  placeholder="••••••"
                />
              </WalletLiquidField>
            </div>
            {fieldHint ? (
              <p className="px-3 text-[12px] text-destructive" role="alert">
                {fieldHint}
              </p>
            ) : null}
          </div>
        </div>
        <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-3 pb-0")}>
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              disabled={code.trim().length < 4 || submitting}
              onClick={() => void onConfirmWithdrawal()}
            >
              {submitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("withdrawSubmitting")}
                </>
              ) : (
                t("withdrawConfirm")
              )}
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <WalletQrScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={onCameraDetected}
        onFallbackFile={() => scanInputRef.current?.click()}
      />
      <div className={cn(chatMobileSheetBodyClass, "overflow-y-auto pt-5")}>
        <div className="flex flex-col gap-4">
          <div>
            <label
              className={cn(chatMobileSheetSectionLabelClass, "mb-2 block px-3")}
            >
              {t("withdrawAmount")}
            </label>
            <WalletLiquidField className="flex items-center ps-3 pe-1.5">
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
                className="relative z-10 h-12 min-w-0 flex-1 border-0 bg-transparent ps-2 pe-3 text-[16px]! shadow-none focus-visible:ring-0 max-md:text-[16px]!"
              />
            </WalletLiquidField>
            <p className="mt-1.5 px-3 text-[12px] text-muted-foreground">
              {t("withdrawAvailable", {
                amount: maxUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              })}
            </p>
            <div className="mt-2 px-6 sm:px-7">
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
            <p
              className={cn(chatMobileSheetSectionLabelClass, "mb-2 block px-3")}
            >
              {t("withdrawNetwork")}
            </p>
            <div className="flex flex-wrap gap-2 px-3">
              {(availableNetworks.length ? availableNetworks : [...NETWORKS]).map(
                (name) => {
                  const active = activeNetwork === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNetwork(name)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                        active
                          ? "bg-[#2563EB] text-white"
                          : "bg-white/55 text-foreground/70 dark:bg-white/10"
                      )}
                    >
                      {name}
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <div>
            <label
              className={cn(chatMobileSheetSectionLabelClass, "mb-2 block px-3")}
            >
              {t("withdrawAddress")}
            </label>
            <WalletLiquidField className="flex items-center gap-0.5 ps-3 pe-1.5">
              <WalletIcon
                className="relative z-10 size-4 shrink-0 stroke-[1.75] text-foreground/35"
                aria-hidden
              />
              {/*
                iOS Safari zooms any focused control under 16px. Keep real font-size
                at 16px, then visually shrink on small screens so mono addresses
                don’t dominate the row (≈14px look without triggering zoom).
              */}
              <div className="relative z-10 min-w-0 flex-1 overflow-hidden">
                <Input
                  ref={addressInputRef}
                  value={address}
                  onChange={(e) => {
                    setFieldHint(null)
                    setAddress(e.target.value)
                  }}
                  placeholder={activeNetwork === "TRC20" ? "T…" : "0x…"}
                  className={cn(
                    "h-12 border-0 bg-transparent ps-2 pe-1.5 font-mono tracking-tight shadow-none focus-visible:ring-0",
                    "text-[16px]! max-md:text-[16px]!",
                    "max-md:origin-left max-md:scale-[0.875] max-md:w-[calc(100%/0.875)]"
                  )}
                />
              </div>
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
                disabled={scanningFile || cameraOpen}
                onClick={() => {
                  setFieldHint(null)
                  setCameraOpen(true)
                }}
              >
                {scanningFile ? (
                  <Loader2Icon className="size-4 animate-spin stroke-[1.75]" />
                ) : (
                  <ScanLineIcon className="size-4 stroke-[1.75]" />
                )}
              </button>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) void onScanFile(file)
                }}
              />
            </WalletLiquidField>
            {fieldHint ? (
              <p
                className="mt-1.5 px-3 text-[12px] text-destructive"
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
            disabled={!formValid || submitting || maxUsd <= 0}
            onClick={() => void onRequestChallenge()}
          >
            {submitting ? (
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
    </div>
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
          {open ? (
            <WithdrawBody
              availableUsd={availableUsd}
              onClose={() => onOpenChange(false)}
              footerClassName="pb-2"
            />
          ) : null}
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
        {open ? (
          <WithdrawBody
            availableUsd={availableUsd}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { WalletWithdrawSheet }
