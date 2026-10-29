"use client"

import * as React from "react"
import { Loader2Icon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  chatMobileSheetPrimaryButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

type BarcodeDetectorLike = {
  detect: (
    source: ImageBitmapSource
  ) => Promise<Array<{ rawValue?: string }>>
}

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = (
    globalThis as unknown as {
      BarcodeDetector?: new (opts?: {
        formats?: string[]
      }) => BarcodeDetectorLike
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

function WalletQrScanner({
  open,
  onClose,
  onDetected,
  onFallbackFile,
}: {
  open: boolean
  onClose: () => void
  onDetected: (rawValue: string) => void
  /** When live camera is unavailable, open the photo/file picker. */
  onFallbackFile: () => void
}) {
  const t = useTranslations("deskProfile")
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const busyRef = React.useRef(false)
  const [starting, setStarting] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const stopCamera = React.useCallback(() => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const stream = streamRef.current
    streamRef.current = null
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
    }
    const video = videoRef.current
    if (video) {
      video.srcObject = null
    }
  }, [])

  React.useEffect(() => {
    if (!open) return

    let cancelled = false
    const detector = getBarcodeDetector()

    async function start() {
      setStarting(true)
      setError(null)

      if (!detector) {
        setStarting(false)
        setError(t("withdrawScanUnsupported"))
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStarting(false)
        setError(t("withdrawScanUnsupported"))
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop()
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setStarting(false)

        const tick = async () => {
          if (cancelled || busyRef.current) {
            rafRef.current = window.requestAnimationFrame(() => {
              void tick()
            })
            return
          }
          const el = videoRef.current
          if (!el || el.readyState < 2) {
            rafRef.current = window.requestAnimationFrame(() => {
              void tick()
            })
            return
          }
          busyRef.current = true
          try {
            const codes = await detector.detect(el)
            const raw =
              codes.map((c) => c.rawValue ?? "").find(Boolean) ?? ""
            if (raw) {
              onDetected(raw)
              return
            }
          } catch {
            // Keep scanning; transient detect errors are common.
          } finally {
            busyRef.current = false
          }
          rafRef.current = window.requestAnimationFrame(() => {
            void tick()
          })
        }
        rafRef.current = window.requestAnimationFrame(() => {
          void tick()
        })
      } catch {
        if (cancelled) return
        setStarting(false)
        setError(t("withdrawScanPermission"))
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [onDetected, open, stopCamera, t])

  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col rounded-[inherit] bg-black/92 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={t("withdrawScan")}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <p className="text-[13px] font-semibold tracking-tight">
          {t("withdrawScan")}
        </p>
        <button
          type="button"
          onClick={() => {
            stopCamera()
            onClose()
          }}
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20"
          aria-label={t("withdrawScanCancel")}
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            "absolute inset-0 size-full object-cover",
            starting || error ? "opacity-0" : "opacity-100"
          )}
        />
        {!error ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          />
        ) : null}
        {starting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2Icon className="size-6 animate-spin text-white/80" />
            <p className="text-[12px] text-white/70">{t("withdrawScanStarting")}</p>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[13px] text-white/85">{error}</p>
            <Button
              type="button"
              className={cn(chatMobileSheetPrimaryButtonClass, "h-10 px-4")}
              onClick={() => {
                stopCamera()
                onClose()
                onFallbackFile()
              }}
            >
              {t("withdrawScanPickPhoto")}
            </Button>
          </div>
        ) : null}
      </div>

      <p className="px-5 pt-3 pb-4 text-center text-[12px] text-white/65">
        {t("withdrawScanHint")}
      </p>
    </div>
  )
}

export { WalletQrScanner, getBarcodeDetector }
