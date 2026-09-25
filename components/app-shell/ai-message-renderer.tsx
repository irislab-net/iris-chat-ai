"use client"

import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"

import { prepareAssistantMarkdown } from "@/lib/prepare-assistant-markdown"
import { cn } from "@/lib/utils"

marked.setOptions({
  gfm: true,
  breaks: true,
})

type PurifyConfig = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>

const PURIFY_OPTIONS: PurifyConfig = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [
    "style",
    "form",
    "input",
    "button",
    "textarea",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
  ],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ["target", "rel"],
  RETURN_TRUSTED_TYPE: false,
}

let hooksInstalled = false

function ensurePurifyHooks() {
  if (hooksInstalled) return
  hooksInstalled = true
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!("tagName" in node) || node.tagName !== "A") return
    const href = node.getAttribute("href") ?? ""
    if (/^\s*javascript:/i.test(href) || /^\s*data:/i.test(href)) {
      node.removeAttribute("href")
      return
    }
    node.setAttribute("rel", "noopener noreferrer nofollow")
    if (/^\s*https?:/i.test(href)) {
      node.setAttribute("target", "_blank")
    }
  })
}

const aiMessageClassName = cn(
  "ai-message chat-bidi min-w-0 wrap-anywhere overflow-x-auto text-sm leading-[1.7] sm:text-[13px]",
  "[&_p]:mb-3 [&_p:last-child]:mb-0 [&_p]:leading-[1.65]",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1:first-child]:mt-0",
  "[&_h2]:mt-3.5 [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2:first-child]:mt-0",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3:first-child]:mt-0",
  "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5 [&_ul:last-child]:mb-0",
  "[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5 [&_ol:last-child]:mb-0",
  "[&_li]:leading-[1.6]",
  "[&_blockquote]:my-3 [&_blockquote]:border-s-2 [&_blockquote]:border-border/70 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-4 [&_hr]:border-border/60",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-2 hover:[&_a]:decoration-foreground/60",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_code]:rounded-md [&_code]:bg-foreground/6 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/50 [&_pre]:bg-foreground/4 [&_pre]:p-3.5 [&_pre:last-child]:mb-0",
  "[&_pre_code]:block [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs [&_pre_code]:leading-[1.55]",
  "[&_table]:my-4 [&_table]:w-full [&_table]:min-w-0 [&_table]:border-collapse [&_table]:text-xs [&_table]:leading-[1.5] max-md:[&_table]:table-fixed sm:[&_table]:min-w-[32rem]",
  "[&_thead]:border-b [&_thead]:border-border/60 [&_thead]:bg-muted/40",
  "[&_tbody]:divide-y [&_tbody]:divide-border/50",
  "[&_tr]:align-top",
  "[&_th]:px-2.5 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold [&_th]:whitespace-normal [&_th]:break-words [&_th]:wrap-anywhere [&_th]:text-foreground max-md:[&_th]:max-w-0 sm:[&_th]:px-3.5 sm:[&_th]:py-2.5",
  "[&_td]:px-2.5 [&_td]:py-2 [&_td]:text-start [&_td]:align-top [&_td]:whitespace-normal [&_td]:break-words [&_td]:wrap-anywhere [&_td]:text-foreground/90 max-md:[&_td]:max-w-0 sm:[&_td]:px-3.5 sm:[&_td]:py-2.5"
)

function renderAssistantHtml(content: string) {
  ensurePurifyHooks()
  const prepared = prepareAssistantMarkdown(content)
  const parsed = marked.parse(prepared, { async: false })
  const raw = typeof parsed === "string" ? parsed : ""
  return String(DOMPurify.sanitize(raw, PURIFY_OPTIONS))
}

/**
 * Renders assistant markdown (GFM tables, lists, code, links) for the chat UI.
 */
function AIMessageRenderer({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const html = renderAssistantHtml(content)

  return (
    <div
      data-ai-message-renderer=""
      className={cn(aiMessageClassName, className)}
      dir="auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export { AIMessageRenderer, renderAssistantHtml }
