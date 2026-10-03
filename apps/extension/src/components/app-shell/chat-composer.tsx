"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  BarChart3Icon,
  ChevronDownIcon,
  FileCode2Icon,
  FileTextIcon,
  LockIcon,
  PaperclipIcon,
  PlusIcon,
  SquareIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Button } from "@/components/ui/button"
import {
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  CHAT_EFFORT_OPTIONS,
  DEFAULT_CHAT_EFFORT,
  type ChatEffort,
} from "@/lib/chat-effort"
import {
  applyMentionSelection,
  expandComposerMentions,
  filterMentionOptions,
  IRIS_MENTION_OPTIONS,
  mentionTokenForTool,
  parseMentionPalette,
  splitComposerMentionHighlights,
  type IrisMentionOption,
  type MentionPaletteState,
} from "@/lib/chat/composer-mentions"
import {
  buildMessageWithPasteAttachments,
  createPasteAttachment,
  formatPasteAttachmentSize,
  PASTE_ATTACHMENT_MAX,
  shouldConvertPasteToAttachment,
  type ComposerPasteAttachment,
} from "@/lib/chat/composer-paste-attachment"
import { localeDirection } from "@/lib/i18n/locale"
import { mergeRefs } from "@/lib/merge-refs"
import {
  chatMobileComposerIconButtonClass,
  chatMobileComposerIconButtonCompactClass,
  chatMobileComposerLeadingClass,
  chatMobileComposerPillClass,
  chatMobileComposerTrailingClass,
  chatMobileComposerPillCompactClass,
  chatMobileComposerPillExpandedClass,
  chatMobileComposerSendClass,
  chatMobileComposerSendIdleClass,
  chatMobileComposerTextareaClass,
  chatMobileComposerTextareaCompactClass,
  chatMobileComposerTextareaExpandedClass,
  chatDesktopComposerBodyClass,
  chatDesktopComposerEffortButtonClass,
  chatDesktopComposerIconButtonClass,
  chatDesktopComposerSendClass,
  chatDesktopComposerSendDisabledClass,
  chatDesktopComposerShellClass,
  chatDesktopComposerTextareaClass,
  chatComposerPasteChipClass,
  chatComposerPasteChipIconClass,
  chatComposerPasteChipMetaClass,
  chatComposerPasteChipCloseClass,
  chatMobileComposerShellClass,
  chatMobileToolsMenuClass,
  chatMobileToolsMenuItemClass,
  chatMobileToolsMenuItemDescClass,
  chatMobileToolsMenuItemTitleClass,
  chatMobileToolsMenuLabelClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/** Composer "+" tools menu (signal). */
const SHOW_COMPOSER_TOOLS_MENU = true

type ChatComposerProps = {
  onSend?: (message: string) => void
  /** Abort the in-flight reply (shown as Stop while `sending`). */
  onStop?: () => void
  /** True while waiting for / streaming an assistant reply. */
  sending?: boolean
  disabled?: boolean
  className?: string
  value?: string
  onValueChange?: (value: string) => void
  textareaRef?: React.Ref<HTMLTextAreaElement>
  effort?: ChatEffort
  onEffortChange?: (effort: ChatEffort) => void
  /** Hide effort picker — guests must use normal effort only. */
  hideEffort?: boolean
  /** Gemini-style floating pill — used on mobile full-screen chat. */
  layout?: "default" | "floating"
  onFloatingFocusChange?: (focused: boolean) => void
}

function ChatComposer({
  onSend,
  onStop,
  sending = false,
  disabled,
  className,
  value: valueProp,
  onValueChange,
  textareaRef,
  effort = DEFAULT_CHAT_EFFORT,
  onEffortChange,
  hideEffort = false,
  layout = "default",
  onFloatingFocusChange,
}: ChatComposerProps) {
  const t = useTranslations("workspace")
  const textDir = localeDirection(useLocale())
  const isDesktop = useIsDesktop()
  const isMobile = isDesktop === false
  const isFloating = layout === "floating"
  const deferMobileKeyboard = isFloating && isDesktop !== true
  const [userUnlockedKeyboard, setUserUnlockedKeyboard] = React.useState(false)
  const mobileKeyboardReady = !deferMobileKeyboard || userUnlockedKeyboard
  /** Ignore ghost taps when chat mounts under the finger (click retargeting). */
  const keyboardUnlockAllowedAtRef = React.useRef(0)
  const [uncontrolled, setUncontrolled] = React.useState("")
  const [pasteAttachments, setPasteAttachments] = React.useState<
    ComposerPasteAttachment[]
  >([])
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const [cursor, setCursor] = React.useState(0)
  const localRef = React.useRef<HTMLTextAreaElement>(null)
  const highlightRef = React.useRef<HTMLDivElement>(null)
  /** Stable compact column width — expanded layout is full-width and must not drive collapse. */
  const compactFieldWidthRef = React.useRef(0)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolled
  const composerValue = value
  const signalToolLabel = t("composerToolSignalLabel")
  function mentionOptionLabel(option: IrisMentionOption) {
    return option.tool === "signal" ? signalToolLabel : option.label
  }
  const mentionHighlightParts = React.useMemo(
    () => splitComposerMentionHighlights(composerValue),
    [composerValue]
  )
  const hasMentionHighlight = mentionHighlightParts.some(
    (part) => part.type === "mention"
  )

  const toolsMenuItems = (
    <DropdownMenuGroup>
      {IRIS_MENTION_OPTIONS.map((option) => (
        <DropdownMenuItem
          key={option.id}
          className={cn(
            chatMobileToolsMenuItemClass,
            "flex-row items-center gap-3 py-2.5"
          )}
          onClick={() => insertMentionToken(option)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground dark:bg-white/8">
            <TrendingUpIcon className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
            <span className={chatMobileToolsMenuItemTitleClass}>
              {mentionOptionLabel(option)}
            </span>
            <span
              className={cn(chatMobileToolsMenuItemDescClass, "line-clamp-2")}
            >
              {t("composerToolSignalDesc")}
            </span>
          </span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuItem
        disabled
        className={cn(
          chatMobileToolsMenuItemClass,
          "flex-row items-center gap-3 py-2.5 opacity-55"
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/4 text-muted-foreground dark:bg-white/6">
          <BarChart3Icon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
          <span className={chatMobileToolsMenuItemTitleClass}>
            {t("composerToolAnalyticsLabel")}
          </span>
          <span
            className={cn(chatMobileToolsMenuItemDescClass, "line-clamp-2")}
          >
            {t("composerToolAnalyticsDesc")}
          </span>
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled
        className={cn(
          chatMobileToolsMenuItemClass,
          "flex-row items-center gap-3 py-2.5 opacity-55"
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/4 text-muted-foreground dark:bg-white/6">
          <PaperclipIcon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={chatMobileToolsMenuItemTitleClass}>
              {t("composerToolUploadLabel")}
            </span>
            <span
              className={cn(chatMobileToolsMenuItemDescClass, "line-clamp-2")}
            >
              {t("composerToolUploadDesc")}
            </span>
          </span>
          <LockIcon
            className="size-3.5 shrink-0 text-muted-foreground/70"
            aria-hidden
          />
        </span>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
  const [floatingPastSingleLine, setFloatingPastSingleLine] =
    React.useState(false)
  const floatingExpandedRef = React.useRef(false)
  const floatingComposerExpanded =
    floatingPastSingleLine || pasteAttachments.length > 0

  React.useEffect(() => {
    floatingExpandedRef.current = floatingComposerExpanded
  }, [floatingComposerExpanded])
  const canSend =
    !disabled &&
    !sending &&
    (composerValue.trim().length > 0 || pasteAttachments.length > 0)
  const showStop = sending && Boolean(onStop)

  const measureFloatingComposerLines = React.useCallback(
    (el: HTMLTextAreaElement, text: string, width: number) => {
      if (!text) return 1
      if (text.includes("\n")) return text.split("\n").length

      const lineHeight = 32
      const paddingY = 8
      const style = window.getComputedStyle(el)
      const mirror = document.createElement("textarea")
      mirror.value = text
      mirror.readOnly = true
      mirror.tabIndex = -1
      mirror.setAttribute("aria-hidden", "true")
      Object.assign(mirror.style, {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        height: "auto",
        maxHeight: "none",
        width: `${width}px`,
        overflow: "hidden",
        border: "0",
        padding: "4px 10px",
        font: style.font,
        letterSpacing: style.letterSpacing,
        lineHeight: "32px",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        boxSizing: "border-box",
      })
      el.parentElement?.appendChild(mirror)
      const lineCount = Math.max(
        1,
        Math.round((mirror.scrollHeight - paddingY) / lineHeight)
      )
      mirror.remove()
      return lineCount
    },
    []
  )

  const syncFloatingComposerLayout = React.useCallback(() => {
    if (!isFloating) return
    const el = localRef.current
    if (!el) return

    if (!floatingExpandedRef.current && el.clientWidth > 0) {
      compactFieldWidthRef.current = el.clientWidth
    }

    const measureWidth =
      compactFieldWidthRef.current > 0
        ? compactFieldWidthRef.current
        : el.clientWidth
    if (measureWidth <= 0) return

    if (
      !floatingExpandedRef.current &&
      composerValue.length > 0 &&
      el.scrollWidth > el.clientWidth + 2
    ) {
      setFloatingPastSingleLine(true)
      return
    }

    const lineCount = measureFloatingComposerLines(
      el,
      composerValue,
      measureWidth
    )

    setFloatingPastSingleLine(() => {
      if (composerValue.trim() === "") return false
      return lineCount >= 2
    })
  }, [composerValue, isFloating, measureFloatingComposerLines])
  const textareaNodeRef = React.useMemo(
    () => mergeRefs(localRef, textareaRef),
    [textareaRef]
  )

  const mentionPalette = React.useMemo(
    () => parseMentionPalette(composerValue, cursor),
    [composerValue, cursor]
  )

  const mentionOptions = React.useMemo(
    () => (mentionPalette ? filterMentionOptions(mentionPalette.query) : []),
    [mentionPalette]
  )

  const mentionOpen = Boolean(mentionPalette && mentionOptions.length > 0)

  React.useEffect(() => {
    if (!isFloating) return
    const el = localRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => syncFloatingComposerLayout())
    observer.observe(el)
    return () => observer.disconnect()
  }, [isFloating, syncFloatingComposerLayout])

  // Remeasure after programmatic value changes (sample prompts). Layout setState
  // runs on the next frame — not synchronously inside the effect body.
  React.useEffect(() => {
    if (!isFloating) return
    const id = requestAnimationFrame(() => syncFloatingComposerLayout())
    return () => cancelAnimationFrame(id)
  }, [composerValue, isFloating, syncFloatingComposerLayout])

  React.useEffect(() => {
    if (!deferMobileKeyboard) return
    keyboardUnlockAllowedAtRef.current = Date.now() + 500
    const id = window.setTimeout(() => {
      setUserUnlockedKeyboard(false)
    }, 0)
    return () => window.clearTimeout(id)
  }, [deferMobileKeyboard])

  React.useEffect(() => {
    if (!deferMobileKeyboard || mobileKeyboardReady) return

    const blurIfFocused = () => {
      const el = localRef.current
      if (el && document.activeElement === el) {
        el.blur()
      }
    }

    blurIfFocused()
    const raf = requestAnimationFrame(blurIfFocused)
    const timer = window.setTimeout(blurIfFocused, 50)

    const onFocusIn = (event: FocusEvent) => {
      if (event.target === localRef.current) blurIfFocused()
    }

    document.addEventListener("focusin", onFocusIn, true)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      document.removeEventListener("focusin", onFocusIn, true)
    }
  }, [deferMobileKeyboard, mobileKeyboardReady])

  const focusComposer = React.useCallback(
    (options?: { force?: boolean }) => {
      const el = localRef.current
      if (!el) return
      if (isDesktop !== true && !options?.force) return
      if (deferMobileKeyboard && !mobileKeyboardReady && !options?.force) return
      try {
        if (isDesktop === true) {
          el.focus({ preventScroll: true })
        } else {
          el.focus()
        }
      } catch {
        el.focus()
      }
    },
    [deferMobileKeyboard, isDesktop, mobileKeyboardReady]
  )

  const enableMobileKeyboard = React.useCallback(() => {
    if (!deferMobileKeyboard) return
    if (Date.now() < keyboardUnlockAllowedAtRef.current) return
    setUserUnlockedKeyboard(true)
    queueMicrotask(() => focusComposer({ force: true }))
  }, [deferMobileKeyboard, focusComposer])

  function syncMentionIndex(nextValue: string, selectionStart: number) {
    const nextPalette = parseMentionPalette(nextValue, selectionStart)
    const prevPalette = parseMentionPalette(composerValue, cursor)
    if (nextPalette?.query !== prevPalette?.query) {
      setMentionIndex(0)
    }
  }

  function syncCursor() {
    const next = localRef.current?.selectionStart ?? composerValue.length
    setCursor(next)
  }

  function syncHighlightScroll() {
    const el = localRef.current
    const mirror = highlightRef.current
    if (!el || !mirror) return
    mirror.scrollTop = el.scrollTop
    mirror.scrollLeft = el.scrollLeft
  }

  function setValue(next: string) {
    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
  }

  function send() {
    if (disabled || sending) return
    const withFiles = buildMessageWithPasteAttachments(
      composerValue,
      pasteAttachments,
      t("composerPasteAttachmentEmptyPrompt")
    )
    const expanded = expandComposerMentions(withFiles.trim())
    if (!expanded && pasteAttachments.length === 0) return
    const outbound = expanded || withFiles.trim()
    if (!outbound) return
    onSend?.(outbound)
    setPasteAttachments([])
    if (!isControlled) setUncontrolled("")
    onValueChange?.("")
  }

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd+Shift+V → keep as plain text (ChatGPT escape hatch).
    // ClipboardEvent typings omit modifiers; browsers still expose them on paste.
    if ((event.nativeEvent as ClipboardEvent & { shiftKey?: boolean }).shiftKey)
      return
    const text = event.clipboardData.getData("text/plain")
    if (!text || !shouldConvertPasteToAttachment(text)) return
    if (pasteAttachments.length >= PASTE_ATTACHMENT_MAX) return
    event.preventDefault()
    setPasteAttachments((prev) => [...prev, createPasteAttachment(text, prev)])
    requestAnimationFrame(syncFloatingComposerLayout)
  }

  function removePasteAttachment(id: string) {
    setPasteAttachments((prev) => prev.filter((item) => item.id !== id))
    requestAnimationFrame(syncFloatingComposerLayout)
  }

  function unwrapPasteAttachment(id: string) {
    const attachment = pasteAttachments.find((item) => item.id === id)
    if (!attachment) return
    setPasteAttachments((prev) => prev.filter((item) => item.id !== id))
    const el = localRef.current
    const start = el?.selectionStart ?? composerValue.length
    const end = el?.selectionEnd ?? start
    const next = `${composerValue.slice(0, start)}${attachment.content}${composerValue.slice(end)}`
    setValue(next)
    queueMicrotask(() => {
      const node = localRef.current
      if (!node) return
      const cursorAt = start + attachment.content.length
      node.setSelectionRange(cursorAt, cursorAt)
      setCursor(cursorAt)
      focusComposer()
      syncFloatingComposerLayout()
    })
  }

  function stop() {
    if (!sending) return
    onStop?.()
  }

  function placeCaret(nextCursor: number) {
    queueMicrotask(() => {
      const el = localRef.current
      if (!el) return
      el.setSelectionRange(nextCursor, nextCursor)
      setCursor(nextCursor)
      focusComposer()
      syncHighlightScroll()
    })
  }

  function commitInlineMention(
    option: IrisMentionOption,
    palette?: MentionPaletteState | null
  ) {
    const token = mentionTokenForTool(
      option.tool,
      mentionOptionLabel(option)
    )
    if (palette) {
      const { nextText, nextCursor } = applyMentionSelection({
        text: composerValue,
        replaceStart: palette.replaceStart,
        replaceEnd: palette.replaceEnd,
        token,
      })
      setValue(nextText)
      placeCaret(nextCursor)
      return
    }

    const end = localRef.current?.selectionEnd ?? cursor
    const before = composerValue.slice(0, cursor)
    const after = composerValue.slice(end)
    const trimmedBefore = before.replace(/\/(?:[\w\u0600-\u06FF.-]*)?$/u, "")
    const nextText = `${trimmedBefore}${token}${after}`
    const nextCursor = trimmedBefore.length + token.length
    setValue(nextText)
    placeCaret(nextCursor)
  }

  function insertMentionToken(option: IrisMentionOption) {
    commitInlineMention(option)
  }

  function applyMention(option: IrisMentionOption) {
    if (!mentionPalette) return
    commitInlineMention(option, mentionPalette)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setMentionIndex((index) => (index + 1) % mentionOptions.length)
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setMentionIndex(
          (index) => (index - 1 + mentionOptions.length) % mentionOptions.length
        )
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        const option = mentionOptions[mentionIndex]
        if (option) applyMention(option)
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        return
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  function focusField(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest("button, [role='menu'], [data-mention-item]")) return
    if (deferMobileKeyboard && !mobileKeyboardReady) {
      enableMobileKeyboard()
      return
    }
    if (isDesktop === true || mobileKeyboardReady) {
      localRef.current?.focus()
    }
  }

  return (
    <form
      data-slot="chat-composer"
      dir={textDir}
      className={cn(
        "relative shrink-0",
        isFloating
          ? chatMobileComposerShellClass
          : chatDesktopComposerShellClass,
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        if (showStop) {
          stop()
          return
        }
        send()
      }}
    >
      {mentionOpen ? (
        <div
          className={cn(
            "absolute inset-x-3 bottom-full z-20 mb-2",
            chatMobileToolsMenuClass
          )}
          role="listbox"
          aria-label={t("composerMentionMenu")}
        >
          <p className={chatMobileToolsMenuLabelClass}>
            {t("composerMentionMenu")}
          </p>
          <ul className="max-h-48 overflow-y-auto p-1">
            {mentionOptions.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  data-mention-item=""
                  role="option"
                  aria-selected={index === mentionIndex}
                  className={cn(
                    chatMobileToolsMenuItemClass,
                    index === mentionIndex && "bg-foreground/[0.07]"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    applyMention(option)
                  }}
                >
                  <span className={chatMobileToolsMenuItemTitleClass}>
                    {mentionOptionLabel(option)}
                  </span>
                  <span className={chatMobileToolsMenuItemDescClass}>
                    {t("composerToolSignalDesc")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        data-composer-body=""
        data-composer-expanded={floatingComposerExpanded ? "" : undefined}
        data-composer-multiline={floatingPastSingleLine ? "" : undefined}
        className={cn(
          "cursor-text transition-[background-color,box-shadow,border-color]",
          isFloating
            ? cn(
                chatMobileComposerPillClass,
                floatingComposerExpanded
                  ? pasteAttachments.length > 0
                    ? "min-h-0 w-full rounded-3xl grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-end gap-x-0.5 gap-y-0.5 px-2.5 py-2.5 [grid-template-areas:'attachments_attachments_attachments'_'field_field_field'_'leading_._trailing']"
                    : chatMobileComposerPillExpandedClass
                  : chatMobileComposerPillCompactClass
              )
            : pasteAttachments.length > 0
              ? cn(
                  chatDesktopComposerBodyClass,
                  "[grid-template-areas:'attachments_attachments_attachments'_'primary_primary_primary'_'leading_._trailing']"
                )
              : chatDesktopComposerBodyClass
        )}
        onClick={focusField}
      >
        {pasteAttachments.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap gap-1.5 [grid-area:attachments]",
              isFloating ? "px-1.5 pt-0.5" : "px-3.5 pt-3"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {pasteAttachments.map((attachment) => (
              <ComposerPasteAttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removePasteAttachment(attachment.id)}
                onUnwrap={() => unwrapPasteAttachment(attachment.id)}
                removeLabel={t("composerPasteAttachmentRemove")}
                unwrapLabel={t("composerPasteAttachmentUnwrap")}
                linesLabel={t("composerPasteAttachmentLines", {
                  count: attachment.lineCount,
                })}
              />
            ))}
          </div>
        ) : null}
        {isFloating ? (
          <>
            <div className={chatMobileComposerLeadingClass}>
              {SHOW_COMPOSER_TOOLS_MENU ? (
                <DropdownMenu modal={false}>
                  <ActionTooltip label={t("composerToolsMenu")}>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("composerToolsMenu")}
                          disabled={disabled}
                          className={
                            floatingComposerExpanded
                              ? chatMobileComposerIconButtonClass
                              : chatMobileComposerIconButtonCompactClass
                          }
                        />
                      }
                    >
                      <PlusIcon className="size-5" />
                    </DropdownMenuTrigger>
                  </ActionTooltip>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={18}
                    showBackdrop
                    backdropClassName="bg-black/8 supports-backdrop-filter:bg-black/[0.04] supports-backdrop-filter:backdrop-blur-xs dark:bg-black/30 dark:supports-backdrop-filter:bg-black/20"
                    className={cn(chatMobileToolsMenuClass, "z-60")}
                  >
                    {toolsMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <div
              className={cn(
                "relative min-w-0 [grid-area:field]",
                floatingComposerExpanded
                  ? chatMobileComposerTextareaExpandedClass
                  : chatMobileComposerTextareaCompactClass
              )}
            >
              {hasMentionHighlight ? (
                <div
                  ref={highlightRef}
                  aria-hidden
                  dir={textDir}
                  className={cn(
                    chatMobileComposerTextareaClass,
                    "pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words text-foreground",
                    floatingComposerExpanded
                      ? chatMobileComposerTextareaExpandedClass
                      : chatMobileComposerTextareaCompactClass
                  )}
                >
                  <ComposerMentionHighlight parts={mentionHighlightParts} />
                </div>
              ) : null}
              <Textarea
                ref={textareaNodeRef}
                value={composerValue}
                aria-label={t("composerAriaLabel")}
                onChange={(event) => {
                  const next = event.target.value
                  const start = event.target.selectionStart
                  syncMentionIndex(next, start)
                  setValue(next)
                  setCursor(start)
                  requestAnimationFrame(() => {
                    syncFloatingComposerLayout()
                    syncHighlightScroll()
                  })
                }}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                onKeyUp={syncCursor}
                onClick={syncCursor}
                onSelect={syncCursor}
                onScroll={syncHighlightScroll}
                placeholder={t("composerMobilePlaceholder")}
                rows={1}
                disabled={disabled}
                readOnly={deferMobileKeyboard && !mobileKeyboardReady}
                tabIndex={deferMobileKeyboard && !mobileKeyboardReady ? -1 : 0}
                inputMode={
                  deferMobileKeyboard && !mobileKeyboardReady ? "none" : "text"
                }
                enterKeyHint="send"
                onFocus={(event) => {
                  if (deferMobileKeyboard && !mobileKeyboardReady) {
                    event.currentTarget.blur()
                    return
                  }
                  onFloatingFocusChange?.(true)
                  syncFloatingComposerLayout()
                }}
                onBlur={() => {
                  onFloatingFocusChange?.(false)
                }}
                dir={textDir}
                className={cn(
                  chatMobileComposerTextareaClass,
                  "relative z-10 min-w-0 caret-foreground",
                  floatingComposerExpanded
                    ? chatMobileComposerTextareaExpandedClass
                    : chatMobileComposerTextareaCompactClass,
                  hasMentionHighlight && "text-transparent"
                )}
              />
            </div>
            <div className={chatMobileComposerTrailingClass}>
              {showStop ? (
                <ActionTooltip label={t("composerStopTitle")}>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("composerStop")}
                    onClick={stop}
                    className={chatMobileComposerSendClass}
                  >
                    <SquareIcon className="size-3.5 fill-current" />
                  </Button>
                </ActionTooltip>
              ) : (
                <ActionTooltip label={t("composerSendTitle")}>
                  <Button
                    type="submit"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("composerSend")}
                    disabled={!canSend}
                    className={
                      canSend
                        ? chatMobileComposerSendClass
                        : chatMobileComposerSendIdleClass
                    }
                  >
                    <ArrowUpIcon className="size-4.5" />
                  </Button>
                </ActionTooltip>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-11 min-w-0 flex-1 items-start px-3.5 pt-3.5 pb-1.5 [grid-area:primary] sm:min-h-10">
            <div className="relative min-w-0 flex-1">
              {hasMentionHighlight ? (
                <div
                  ref={highlightRef}
                  aria-hidden
                  dir={textDir}
                  className={cn(
                    chatDesktopComposerTextareaClass,
                    "pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words text-foreground"
                  )}
                >
                  <ComposerMentionHighlight parts={mentionHighlightParts} />
                </div>
              ) : null}
              <Textarea
                ref={textareaNodeRef}
                value={composerValue}
                aria-label={t("composerAriaLabel")}
                onChange={(event) => {
                  const next = event.target.value
                  const start = event.target.selectionStart
                  syncMentionIndex(next, start)
                  setValue(next)
                  setCursor(start)
                  requestAnimationFrame(syncHighlightScroll)
                }}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                onKeyUp={syncCursor}
                onClick={syncCursor}
                onSelect={syncCursor}
                onScroll={syncHighlightScroll}
                placeholder={t("composerPlaceholder")}
                rows={1}
                disabled={disabled}
                readOnly={deferMobileKeyboard && !mobileKeyboardReady}
                tabIndex={deferMobileKeyboard && !mobileKeyboardReady ? -1 : 0}
                inputMode={
                  deferMobileKeyboard && !mobileKeyboardReady ? "none" : "text"
                }
                enterKeyHint="send"
                onFocus={(event) => {
                  if (deferMobileKeyboard && !mobileKeyboardReady) {
                    event.currentTarget.blur()
                    return
                  }
                }}
                dir={textDir}
                className={cn(
                  chatDesktopComposerTextareaClass,
                  "relative z-10 caret-foreground",
                  hasMentionHighlight && "text-transparent"
                )}
              />
            </div>
          </div>
        )}
        {!isFloating ? (
          <div className="flex items-center gap-1.5 px-0.5 pb-0.5 [grid-area:leading]">
            {SHOW_COMPOSER_TOOLS_MENU ? (
              <DropdownMenu modal={isMobile ? false : undefined}>
                <ActionTooltip label={t("composerToolsMenu")}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("composerToolsMenu")}
                        disabled={disabled}
                        className={chatDesktopComposerIconButtonClass}
                      />
                    }
                  >
                    <PlusIcon className="size-4" />
                  </DropdownMenuTrigger>
                </ActionTooltip>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  sideOffset={18}
                  showBackdrop
                  backdropClassName="bg-black/8 supports-backdrop-filter:bg-black/[0.04] supports-backdrop-filter:backdrop-blur-xs dark:bg-black/30 dark:supports-backdrop-filter:bg-black/20"
                  className={cn(
                      chatMobileToolsMenuClass,
                      "z-60"
                    )}
                >
                  {toolsMenuItems}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {!hideEffort ? (
              <DropdownMenu modal={isMobile ? false : undefined}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t("effort.aria", {
                        mode: t(`effort.${effort}`),
                      })}
                      className={chatDesktopComposerEffortButtonClass}
                    />
                  }
                >
                  {t(`effort.${effort}`)}
                  <ChevronDownIcon className="size-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-48 p-2.5"
                  side={isMobile ? "bottom" : "top"}
                >
                  <DropdownMenuGroup>
                    {CHAT_EFFORT_OPTIONS.map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        className="items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
                        onClick={() => onEffortChange?.(item.value)}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                          <span className="text-[13px]">
                            {t(`effort.${item.value}`)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {t(`effort.${item.value}Hint`)}
                          </span>
                        </span>
                        {effort === item.value ? (
                          <SelectionCheckBadge />
                        ) : (
                          <SelectionCheckSpacer />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
        {!isFloating ? (
          <div className="flex items-center justify-end px-1 pb-0.5 [grid-area:trailing]">
            {showStop ? (
              <ActionTooltip label={t("composerStopTitle")}>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("composerStop")}
                  onClick={stop}
                  className={chatDesktopComposerSendClass}
                >
                  <SquareIcon className="size-3.5 fill-current" />
                </Button>
              </ActionTooltip>
            ) : (
              <ActionTooltip label={t("composerSendTitle")}>
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  aria-label={t("composerSend")}
                  disabled={!canSend}
                  className={
                    canSend
                      ? chatDesktopComposerSendClass
                      : chatDesktopComposerSendDisabledClass
                  }
                >
                  <ArrowUpIcon />
                </Button>
              </ActionTooltip>
            )}
          </div>
        ) : null}
      </div>
      {!isFloating ? (
        <p className="mt-2 text-center text-[11px] leading-3.25 tracking-[0.006em] text-muted-foreground/70">
          {t("composerHint")}
        </p>
      ) : null}
    </form>
  )
}

function ComposerMentionHighlight({
  parts,
}: {
  parts: ReturnType<typeof splitComposerMentionHighlights>
}) {
  return (
    <>
      {parts.map((part, index) =>
        part.type === "mention" ? (
          <span
            key={`mention-${index}`}
            className="font-semibold text-primary"
          >
            {part.value}
          </span>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
      {/* Keep trailing newline height in sync with the textarea mirror. */}
      {"\u200b"}
    </>
  )
}

function ComposerPasteAttachmentChip({
  attachment,
  onRemove,
  onUnwrap,
  removeLabel,
  unwrapLabel,
  linesLabel,
}: {
  attachment: ComposerPasteAttachment
  onRemove: () => void
  onUnwrap: () => void
  removeLabel: string
  unwrapLabel: string
  linesLabel: string
}) {
  const Icon =
    attachment.kind === "markdown" ? FileCode2Icon : FileTextIcon

  return (
    <div
      className={chatComposerPasteChipClass}
      role="group"
      aria-label={attachment.name}
    >
      <span className={chatComposerPasteChipIconClass} aria-hidden>
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <button
        type="button"
        className="min-w-0 flex-1 text-start"
        onClick={onUnwrap}
        title={unwrapLabel}
      >
        <span className="block truncate text-[13px] font-medium leading-4 tracking-[-0.01em] text-foreground">
          {attachment.name}
        </span>
        <span className={chatComposerPasteChipMetaClass}>
          {formatPasteAttachmentSize(attachment.charCount)} · {linesLabel}
        </span>
      </button>
      <button
        type="button"
        aria-label={removeLabel}
        className={chatComposerPasteChipCloseClass}
        onClick={onRemove}
      >
        <XIcon className="size-3.5 stroke-[2.25]" />
      </button>
    </div>
  )
}

export { ChatComposer }
