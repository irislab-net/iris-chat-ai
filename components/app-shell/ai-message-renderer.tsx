"use client"

import * as React from "react"
import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"
import { Streamdown } from "streamdown"
import { code } from "@streamdown/code"
import { CopyIcon, CheckIcon, Maximize2Icon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopSearchDialogClass,
  chatMobileSheetContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  segmentAssistantBlocks,
  tableExceedsPreviewThreshold,
  treeExceedsPreviewThreshold,
  type AssistantBlock,
} from "@/lib/chat/assistant-blocks"
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

const proseClassName = cn(
  "ai-message min-w-0 overflow-x-auto chat-bidi text-[16px] font-normal leading-[1.55] tracking-normal wrap-anywhere sm:text-[15px] sm:leading-[1.5] sm:tracking-[-0.01em]",
  "[&_p]:mb-3 [&_p]:leading-[1.55] sm:[&_p]:leading-[1.5] [&_p:last-child]:mb-0",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[22px] [&_h1]:font-semibold [&_h1]:leading-[1.25] [&_h1]:tracking-[-0.02em] [&_h1:first-child]:mt-0 sm:[&_h1]:text-[17px] sm:[&_h1]:leading-5.5",
  "[&_h2]:mt-3.5 [&_h2]:mb-2 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:leading-[1.3] [&_h2]:tracking-[-0.01em] [&_h2:first-child]:mt-0 sm:[&_h2]:text-[16px] sm:[&_h2]:leading-[1.35]",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-[1.35] [&_h3:first-child]:mt-0 sm:[&_h3]:text-[15px] sm:[&_h3]:leading-5",
  "[&_h4]:mt-2.5 [&_h4]:mb-1 [&_h4]:text-[15px] [&_h4]:font-semibold",
  "[&_ul]:my-2.5 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5 [&_ul:last-child]:mb-0",
  "[&_ol]:my-2.5 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5 [&_ol:last-child]:mb-0",
  "[&_li]:leading-[1.5] [&_li+li]:mt-0.5",
  "[&_li>ul]:mt-1.5 [&_li>ul]:mb-0.5 [&_li>ul]:space-y-1 [&_li>ul]:border-s [&_li>ul]:border-border/45 [&_li>ul]:ps-3.5 [&_li>ul]:ms-0.5 [&_li>ul]:pl-0 [&_li>ul]:pr-0",
  "[&_li>ol]:mt-1.5 [&_li>ol]:mb-0.5 [&_li>ol]:space-y-1 [&_li>ol]:border-s [&_li>ol]:border-border/45 [&_li>ol]:ps-3.5 [&_li>ol]:ms-0.5 [&_li>ol]:pl-0 [&_li>ol]:pr-0",
  // Streamdown ships physical pl-*; force logical padding so rails flip in RTL
  "[&_[data-streamdown=unordered-list]]:list-outside [&_[data-streamdown=unordered-list]]:ps-5 [&_[data-streamdown=unordered-list]]:pl-0 [&_[data-streamdown=unordered-list]]:pe-0",
  "[&_[data-streamdown=ordered-list]]:list-outside [&_[data-streamdown=ordered-list]]:ps-5 [&_[data-streamdown=ordered-list]]:pl-0 [&_[data-streamdown=ordered-list]]:pe-0",
  "[&_li_[data-streamdown=unordered-list]]:ps-6 [&_li_[data-streamdown=unordered-list]]:pl-0",
  "[&_li_[data-streamdown=ordered-list]]:ps-6 [&_li_[data-streamdown=ordered-list]]:pl-0",
  "[&_li>p]:mb-0",
  "[&_blockquote]:my-3 [&_blockquote]:border-s-2 [&_blockquote]:border-border/70 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-4 [&_hr]:border-border/60",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-2 hover:[&_a]:decoration-foreground/60",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_code]:rounded-md [&_code]:bg-foreground/6 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]",
  // Fallback bare <pre> (non–code-block) — same soft shell as tables
  "[&_pre]:my-3.5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-border/45 [&_pre]:bg-muted/25 [&_pre]:p-1.5 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-[1.5] [&_pre]:whitespace-pre-wrap [&_pre]:shadow-none sm:[&_pre]:text-[14px] [&_pre:last-child]:mb-0",
  "[&_pre_code]:block [&_pre_code]:rounded-xl [&_pre_code]:border [&_pre_code]:border-border/40 [&_pre_code]:bg-background [&_pre_code]:p-3.5 [&_pre_code]:font-inherit [&_pre_code]:text-inherit [&_pre_code]:leading-inherit",
  // Streamdown code blocks — match table-wrapper: soft outer + clean inner
  "[&_[data-streamdown=code-block]]:my-3.5 [&_[data-streamdown=code-block]]:gap-1.5 [&_[data-streamdown=code-block]]:overflow-hidden [&_[data-streamdown=code-block]]:rounded-2xl [&_[data-streamdown=code-block]]:border [&_[data-streamdown=code-block]]:border-border/45 [&_[data-streamdown=code-block]]:bg-muted/25 [&_[data-streamdown=code-block]]:p-1.5 [&_[data-streamdown=code-block]]:shadow-none",
  "[&_[data-streamdown=code-block-header]]:h-7 [&_[data-streamdown=code-block-header]]:min-h-7 [&_[data-streamdown=code-block-header]]:px-0.5 [&_[data-streamdown=code-block-header]]:text-[12px] [&_[data-streamdown=code-block-header]]:font-medium [&_[data-streamdown=code-block-header]]:tracking-wide [&_[data-streamdown=code-block-header]]:text-muted-foreground",
  "[&_[data-streamdown=code-block-header]_span]:ms-0.5 [&_[data-streamdown=code-block-header]_span]:ml-0 [&_[data-streamdown=code-block-header]_span]:font-medium [&_[data-streamdown=code-block-header]_span]:normal-case",
  "[&_[data-streamdown=code-block-actions]]:gap-0.5 [&_[data-streamdown=code-block-actions]]:rounded-lg [&_[data-streamdown=code-block-actions]]:border [&_[data-streamdown=code-block-actions]]:border-border/40 [&_[data-streamdown=code-block-actions]]:bg-background/90 [&_[data-streamdown=code-block-actions]]:px-1 [&_[data-streamdown=code-block-actions]]:py-0.5 [&_[data-streamdown=code-block-actions]]:shadow-none [&_[data-streamdown=code-block-actions]]:backdrop-blur-sm",
  "[&_[data-streamdown=code-block-body]]:rounded-xl [&_[data-streamdown=code-block-body]]:border [&_[data-streamdown=code-block-body]]:border-border/40 [&_[data-streamdown=code-block-body]]:bg-background [&_[data-streamdown=code-block-body]]:p-3.5 [&_[data-streamdown=code-block-body]]:text-[13px] [&_[data-streamdown=code-block-body]]:leading-[1.5] [&_[data-streamdown=code-block-body]]:shadow-none sm:[&_[data-streamdown=code-block-body]]:text-[14px]",
  // Nested Shiki <pre> inside code-block — strip double chrome
  "[&_[data-streamdown=code-block]_pre]:my-0 [&_[data-streamdown=code-block]_pre]:rounded-none [&_[data-streamdown=code-block]_pre]:border-0 [&_[data-streamdown=code-block]_pre]:bg-transparent [&_[data-streamdown=code-block]_pre]:p-0 [&_[data-streamdown=code-block]_pre_code]:rounded-none [&_[data-streamdown=code-block]_pre_code]:border-0 [&_[data-streamdown=code-block]_pre_code]:bg-transparent [&_[data-streamdown=code-block]_pre_code]:p-0",
  // Clean soft tables — rounded shell + responsive horizontal scroll
  "[&_[data-streamdown=table-wrapper]]:my-3.5 [&_[data-streamdown=table-wrapper]]:gap-1.5 [&_[data-streamdown=table-wrapper]]:overflow-hidden [&_[data-streamdown=table-wrapper]]:rounded-2xl [&_[data-streamdown=table-wrapper]]:border [&_[data-streamdown=table-wrapper]]:border-border/45 [&_[data-streamdown=table-wrapper]]:bg-muted/25 [&_[data-streamdown=table-wrapper]]:p-1.5 [&_[data-streamdown=table-wrapper]]:shadow-none",
  "[&_[data-streamdown=table-wrapper]>div:first-child]:min-h-7 [&_[data-streamdown=table-wrapper]>div:first-child]:px-0.5",
  "[&_[data-streamdown=table-wrapper]>div:last-child]:overflow-x-auto [&_[data-streamdown=table-wrapper]>div:last-child]:rounded-xl [&_[data-streamdown=table-wrapper]>div:last-child]:border [&_[data-streamdown=table-wrapper]>div:last-child]:border-border/40 [&_[data-streamdown=table-wrapper]>div:last-child]:bg-background [&_[data-streamdown=table-wrapper]>div:last-child]:shadow-none",
  "[&_table]:my-0 [&_table]:w-full [&_table]:min-w-0 [&_table]:border-collapse [&_table]:text-[13px] [&_table]:leading-[1.45] sm:[&_table]:text-[14px]",
  "[&_[data-streamdown=table]]:my-0",
  "[&_thead]:border-b [&_thead]:border-border/50 [&_thead]:bg-muted/55",
  "[&_tbody]:divide-y [&_tbody]:divide-border/40",
  "[&_tr]:align-top [&_tr]:transition-colors hover:[&_tbody_tr]:bg-muted/25",
  "[&_th]:px-3 [&_th]:py-2.5 [&_th]:text-start [&_th]:align-middle [&_th]:text-[12px] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:break-words [&_th]:wrap-anywhere [&_th]:whitespace-normal sm:[&_th]:px-3.5 sm:[&_th]:py-3 sm:[&_th]:text-[13px]",
  "[&_td]:px-3 [&_td]:py-2.5 [&_td]:text-start [&_td]:align-middle [&_td]:break-words [&_td]:wrap-anywhere [&_td]:whitespace-normal [&_td]:text-foreground/90 sm:[&_td]:px-3.5 sm:[&_td]:py-3"
)

const treeClassName = cn(
  proseClassName,
  "[&>ul]:list-none [&>ul]:border-s [&>ul]:border-border/50 [&>ul]:ps-4 [&>ul]:pl-0 [&>ul]:pe-0 [&>ul]:space-y-3",
  "[&>_[data-streamdown=unordered-list]]:list-none [&>_[data-streamdown=unordered-list]]:ps-4 [&>_[data-streamdown=unordered-list]]:pl-0 [&>_[data-streamdown=unordered-list]]:pe-0",
  "[&>ul>li]:relative [&>ul>li]:ps-1",
  "[&>ul>li]:before:absolute [&>ul>li]:before:-start-[1.0625rem] [&>ul>li]:before:top-2 [&>ul>li]:before:size-2 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-foreground/45 [&>ul>li]:before:content-['']",
  "[&>ul>li>ul]:border-s-0 [&>ul>li>ul]:list-disc [&>ul>li>ul]:ps-5 [&>ul>li>ul]:pl-0 [&>ul>li>ul>li]:before:content-none [&>ul>li>ul>li]:ps-0"
)

const streamdownPlugins = { code }

/** Logical CSS (border-s / ps) needs a real direction — plaintext alone keeps LTR. */
function resolveContentDir(text: string): "ltr" | "rtl" | "auto" {
  let rtl = 0
  let ltr = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0x0600 && code <= 0x06ff) rtl += 1
    else if (
      (code >= 0x0041 && code <= 0x005a) ||
      (code >= 0x0061 && code <= 0x007a)
    ) {
      ltr += 1
    }
  }
  if (rtl === 0 && ltr === 0) return "auto"
  if (rtl > ltr * 0.6) return "rtl"
  if (ltr > rtl * 0.6) return "ltr"
  return "auto"
}

function MarkdownBody({
  text,
  animating,
  className,
}: {
  text: string
  animating?: boolean
  className?: string
}) {
  const dir = resolveContentDir(text)
  return (
    <Streamdown
      className={cn(className ?? proseClassName)}
      dir={dir}
      mode={animating ? "streaming" : "static"}
      isAnimating={Boolean(animating)}
      parseIncompleteMarkdown={Boolean(animating)}
      plugins={streamdownPlugins}
      linkSafety={{ enabled: true }}
      controls={{
        table: { copy: true, download: true, fullscreen: true },
        code: true,
      }}
      tableMaxHeight={0}
      lineNumbers={false}
    >
      {text}
    </Streamdown>
  )
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations("workspace")
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="shrink-0 text-muted-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          // ignore
        }
      }}
      aria-label={copied ? t("assistantCopied") : t("copy")}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}

function FallbackBlock({ raw, reason }: { raw: string; reason: string }) {
  const t = useTranslations("workspace")
  return (
    <div
      data-assistant-fallback=""
      data-reason={reason}
      className="my-3 rounded-2xl border border-border/60 bg-muted/30 p-3.5"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          {t("assistantRawContent")}
        </p>
        <CopyButton value={raw} />
      </div>
      <pre className="m-0 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">
        {raw}
      </pre>
    </div>
  )
}

function PreviewSheet({
  title,
  markdown,
  variant,
  animating,
}: {
  title: string
  markdown: string
  variant: "table" | "tree"
  animating?: boolean
}) {
  const t = useTranslations("workspace")
  const isDesktop = useIsDesktop()
  const bodyClass = variant === "tree" ? treeClassName : proseClassName
  const trigger = (
    <Button type="button" variant="outline" size="xs" className="gap-1">
      <Maximize2Icon className="size-3.5" />
      {t("assistantFullView")}
    </Button>
  )
  const previewCard = (
    <div className="my-3 rounded-2xl border border-border/45 bg-muted/25 p-1.5 shadow-none">
      <div className="mb-1.5 flex min-h-7 items-center justify-between gap-2 px-0.5">
        <p className="text-[13px] font-medium text-foreground/80">{title}</p>
        <div className="flex items-center gap-1">
          <CopyButton value={markdown} />
          {isDesktop ? (
            <DialogTrigger render={trigger} />
          ) : (
            <SheetTrigger render={trigger} />
          )}
        </div>
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/40 bg-background p-3.5">
        <MarkdownBody
          text={markdown}
          animating={animating}
          className={bodyClass}
        />
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog>
        {previewCard}
        <DialogContent
          className={cn(
            chatDesktopSearchDialogClass,
            "flex max-h-[min(85dvh,52rem)] w-full max-w-[min(56rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(56rem,calc(100%-3rem))]"
          )}
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-0 px-5 py-3.5 pe-14 text-start">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <DialogTitle className="text-[17px] font-medium tracking-tight">
                {title}
              </DialogTitle>
              <CopyButton value={markdown} />
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <MarkdownBody text={markdown} className={bodyClass} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet>
      {previewCard}
      <SheetContent
        side="bottom"
        className={cn(chatMobileSheetContentClass, "flex flex-col p-0")}
      >
        <div className={chatMobileSheetHandleClass} aria-hidden />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0")}>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
            <CopyButton value={markdown} />
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <MarkdownBody text={markdown} className={bodyClass} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BlockView({
  block,
  animating,
}: {
  block: AssistantBlock
  animating?: boolean
}) {
  const t = useTranslations("workspace")
  switch (block.type) {
    case "markdown":
      return <MarkdownBody text={block.text} animating={animating} />
    case "code":
      return (
        <MarkdownBody
          text={
            block.language
              ? `\`\`\`${block.language}\n${block.code}\n\`\`\``
              : `\`\`\`\n${block.code}\n\`\`\``
          }
          animating={animating}
        />
      )
    case "table":
      if (tableExceedsPreviewThreshold(block.markdown)) {
        return (
          <PreviewSheet
            title={t("assistantTablePreview")}
            markdown={block.markdown}
            variant="table"
            animating={animating}
          />
        )
      }
      return <MarkdownBody text={block.markdown} animating={animating} />
    case "tree":
      if (treeExceedsPreviewThreshold(block.markdown)) {
        return (
          <PreviewSheet
            title={t("assistantLevelsPreview")}
            markdown={block.markdown}
            variant="tree"
            animating={animating}
          />
        )
      }
      return (
        <MarkdownBody
          text={block.markdown}
          animating={animating}
          className={treeClassName}
        />
      )
    case "unknown":
      return <FallbackBlock raw={block.raw} reason={block.reason} />
    default:
      return null
  }
}

/**
 * Renders assistant markdown via normalize → typed blocks → Streamdown.
 */
function AIMessageRenderer({
  content,
  className,
  streaming,
}: {
  content: string
  className?: string
  streaming?: boolean
}) {
  const { blocks } = React.useMemo(
    () => segmentAssistantBlocks(content),
    [content]
  )
  const dir = resolveContentDir(content)

  return (
    <div
      data-ai-message-renderer=""
      className={cn("flex min-w-0 flex-col gap-4", className)}
      dir={dir}
    >
      {blocks.map((block, index) => (
        <BlockView
          key={`${block.type}-${index}`}
          block={block}
          animating={streaming}
        />
      ))}
    </div>
  )
}

/**
 * Legacy HTML path for sanitize/XSS unit tests — still goes through normalize.
 */
function renderAssistantHtml(content: string) {
  ensurePurifyHooks()
  const prepared = prepareAssistantMarkdown(content)
  const parsed = marked.parse(prepared, { async: false })
  const raw = typeof parsed === "string" ? parsed : ""
  return String(DOMPurify.sanitize(raw, PURIFY_OPTIONS))
}

export { AIMessageRenderer, renderAssistantHtml, segmentAssistantBlocks }
