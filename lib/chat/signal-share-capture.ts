import { toBlob } from "html-to-image"

/** Capture-safe brand mark (white disc + blue path) under /public. */
export const SIGNAL_SHARE_BRAND_LOGO_SRC = "/exur-logo-brand.svg"
export const SIGNAL_SHARE_CARD_BG = "#f7f8fa"

export function formatSignalShareDate(
  locale: string,
  date: Date = new Date()
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function signalShareBrandLogoSrc(): string {
  if (typeof window === "undefined") return SIGNAL_SHARE_BRAND_LOGO_SRC
  return new URL(SIGNAL_SHARE_BRAND_LOGO_SRC, window.location.origin).href
}

async function waitForShareImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return
      if (typeof img.decode === "function") {
        try {
          await img.decode()
          return
        } catch {
          // Fall through to load wait.
        }
      }
      if (img.complete) return
      await new Promise<void>((resolve) => {
        const done = () => resolve()
        img.addEventListener("load", done, { once: true })
        img.addEventListener("error", done, { once: true })
      })
    })
  )
}

export async function captureShareNodeToBlob(
  node: HTMLElement,
  backgroundColor: string = SIGNAL_SHARE_CARD_BG
): Promise<Blob> {
  await waitForShareImages(node)
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor,
    // Skip external stylesheets that can break foreignObject serialization.
    skipFonts: true,
  })
  if (!blob) throw new Error("preview-empty")
  return blob
}

async function copyImageAndText(blob: Blob, text: string) {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("image-clipboard-unsupported")
  }
  const imageType = blob.type || "image/png"
  await navigator.clipboard.write([
    new ClipboardItem({
      [imageType]: blob,
      "text/plain": new Blob([text], { type: "text/plain" }),
    }),
  ])
}

async function copyText(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("text-clipboard-unsupported")
  }
  await navigator.clipboard.writeText(text)
}

export type ShareImageWithCaptionResult =
  | { kind: "shared" }
  | { kind: "copied-image-and-text" }
  | { kind: "copied-text" }

/**
 * Share a PNG with `text` as the social caption (WhatsApp / Telegram).
 * Never falls back to text-only Web Share when a blob exists.
 */
export async function shareImageWithCaption(input: {
  blob: Blob
  fileName: string
  title: string
  text: string
}): Promise<ShareImageWithCaptionResult> {
  const file = new File([input.blob], input.fileName, {
    type: input.blob.type || "image/png",
  })

  if (
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: input.title,
      text: input.text,
    })
    return { kind: "shared" }
  }

  try {
    await copyImageAndText(input.blob, input.text)
    return { kind: "copied-image-and-text" }
  } catch {
    // Some browsers reject multi-type ClipboardItem; try image-only.
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [input.blob.type || "image/png"]: input.blob }),
        ])
        return { kind: "copied-image-and-text" }
      }
    } catch {
      // Fall through to text.
    }
    await copyText(input.text)
    return { kind: "copied-text" }
  }
}
