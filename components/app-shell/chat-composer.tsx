"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  SquareIcon,
  XIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  expandComposerDraft,
  expandComposerMentions,
  filterMentionOptions,
  findIrisMentionOption,
  IRIS_MENTION_OPTIONS,
  parseComposerToolTag,
  parseMentionPalette,
  type IrisMentionOption,
  type IrisMentionTool,
  type MentionPaletteState,
} from "@/lib/chat/composer-mentions"
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
  chatMobileComposerTextareaClass,
  chatMobileComposerTextareaCompactClass,
  chatMobileComposerTextareaExpandedClass,
  chatDesktopComposerBodyClass,
  chatDesktopComposerEffortButtonClass,
  chatDesktopComposerIconButtonClass,
  chatDesktopComposerSendClass,
  chatDesktopComposerSendDisabledClass,
  chatDesktopComposerShellClass,
  chatDesktopComposerToolChipClass,
  chatDesktopComposerToolChipCloseClass,
  chatMobileComposerToolChipClass,
  chatMobileComposerToolChipCloseClass,
  chatMobileComposerShellClass,
  chatMobileToolsMenuClass,
  chatMobileToolsMenuItemClass,
  chatMobileToolsMenuItemDescClass,
  chatMobileToolsMenuItemTitleClass,
  chatMobileToolsMenuLabelClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/** Hidden for now — re-enable to show the composer "+" tools menu. */
const SHOW_COMPOSER_TOOLS_MENU = false

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
  const [activeTool, setActiveTool] = React.useState<IrisMentionTool | null>(null)
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const [cursor, setCursor] = React.useState(0)
  const localRef = React.useRef<HTMLTextAreaElement>(null)
  /** Stable compact column width — expanded layout is full-width and must not drive collapse. */
  const compactFieldWidthRef = React.useRef(0)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolled
  const toolTagDraft = React.useMemo(
    () => (activeTool ? null : parseComposerToolTag(value)),
    [activeTool, value]
  )
  const effectiveActiveTool = activeTool ?? toolTagDraft?.tool ?? null
  const composerValue = toolTagDraft ? toolTagDraft.text : value
  const activeToolOption = effectiveActiveTool
    ? findIrisMentionOption(effectiveActiveTool)
    : undefined
  const signalToolLabel = t("composerToolSignalLabel")
  function mentionOptionLabel(option: IrisMentionOption) {
    return option.tool === "signal" ? signalToolLabel : option.label
  }
  const activeToolLabel =
    effectiveActiveTool === "signal"
      ? signalToolLabel
      : (activeToolOption?.label ?? effectiveActiveTool)
  const [floatingPastSingleLine, setFloatingPastSingleLine] =
    React.useState(false)
  const floatingExpandedRef = React.useRef(false)
  const floatingComposerExpanded = floatingPastSingleLine

  React.useEffect(() => {
    floatingExpandedRef.current = floatingPastSingleLine
  }, [floatingPastSingleLine])
  const canSend =
    !disabled && !sending && composerValue.trim().length > 0
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

  const mentionPalette = React.useMemo(() => {
    if (effectiveActiveTool) return null
    return parseMentionPalette(composerValue, cursor)
  }, [composerValue, cursor, effectiveActiveTool])

  const mentionOptions = React.useMemo(
    () =>
      mentionPalette ? filterMentionOptions(mentionPalette.query) : [],
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
    if (effectiveActiveTool) return
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

  function setValue(next: string) {
    const parsedNext = parseComposerToolTag(next)
    if (parsedNext) {
      setActiveTool(parsedNext.tool)
      if (!isControlled) setUncontrolled(parsedNext.text)
      onValueChange?.(parsedNext.text)
      return
    }

    // Sample prompts may set a tagged value (e.g. «سیگنال BTC») while the textarea
    // shows only the continuation — promote the chip on the first edit.
    if (!activeTool) {
      const taggedValue = parseComposerToolTag(value)
      if (taggedValue) {
        setActiveTool(taggedValue.tool)
        if (!isControlled) setUncontrolled(next)
        onValueChange?.(next)
        return
      }
    }

    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
  }

  function send() {
    if (disabled || sending) return
    const expanded = effectiveActiveTool
      ? expandComposerDraft({
          tool: effectiveActiveTool,
          text: composerValue.trim(),
        })
      : expandComposerMentions(composerValue.trim())
    if (!expanded) return
    onSend?.(expanded)
    setActiveTool(null)
    if (!isControlled) setUncontrolled("")
    onValueChange?.("")
  }

  function stop() {
    if (!sending) return
    onStop?.()
  }

  function activateTool(tool: IrisMentionTool, palette?: MentionPaletteState | null) {
    if (palette) {
      const { nextText, nextCursor } = applyMentionSelection({
        text: value,
        replaceStart: palette.replaceStart,
        replaceEnd: palette.replaceEnd,
      })
      setValue(nextText)
      queueMicrotask(() => {
        const el = localRef.current
        if (!el) return
        el.setSelectionRange(nextCursor, nextCursor)
        setCursor(nextCursor)
        focusComposer()
      })
    }
    setActiveTool(tool)
    if (isDesktop === true) {
      queueMicrotask(() => focusComposer())
    }
  }

  function clearActiveTool() {
    const taggedValue = parseComposerToolTag(value)
    setActiveTool(null)
    if (taggedValue) {
      if (!isControlled) setUncontrolled(taggedValue.text)
      onValueChange?.(taggedValue.text)
    }
    if (isDesktop === true) focusComposer()
  }

  function insertMentionToken(option: IrisMentionOption) {
    const end = localRef.current?.selectionEnd ?? cursor
    const before = value.slice(0, cursor)
    const after = value.slice(end)
    const trimmedBefore = before.replace(/@(?:[\w\u0600-\u06FF\s.-]*)?$/u, "")
    const nextText = `${trimmedBefore}${after}`
    if (!isControlled) setUncontrolled(nextText)
    onValueChange?.(nextText)
    setActiveTool(option.tool)
  }

  function applyMention(option: IrisMentionOption) {
    if (!mentionPalette) return
    activateTool(option.tool, mentionPalette)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Backspace" &&
      effectiveActiveTool &&
      composerValue.length === 0 &&
      cursor === 0
    ) {
      event.preventDefault()
      clearActiveTool()
      return
    }

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
        isFloating ? chatMobileComposerShellClass : chatDesktopComposerShellClass,
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
          className={cn("absolute inset-x-3 bottom-full z-20 mb-2", chatMobileToolsMenuClass)}
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
        data-composer-expanded={
          floatingComposerExpanded ? "" : undefined
        }
        data-composer-multiline={
          floatingPastSingleLine ? "" : undefined
        }
        className={cn(
          "cursor-text transition-[background-color,box-shadow,border-color]",
          isFloating
            ? cn(
                chatMobileComposerPillClass,
                floatingComposerExpanded
                  ? chatMobileComposerPillExpandedClass
                  : chatMobileComposerPillCompactClass
              )
            : chatDesktopComposerBodyClass
        )}
        onClick={focusField}
      >
        {isFloating ? (
          <>
            <div className={chatMobileComposerLeadingClass}>
              {SHOW_COMPOSER_TOOLS_MENU ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("composerToolsMenu")}
                        title={t("composerToolsMenu")}
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
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    className={cn(
                      chatMobileToolsMenuClass,
                      "min-w-54 border-0 p-1.5 shadow-none ring-0 bg-white/78! dark:bg-white/8!"
                    )}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className={chatMobileToolsMenuLabelClass}>
                        {t("composerToolsMenu")}
                      </DropdownMenuLabel>
                      {IRIS_MENTION_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          className={cn(chatMobileToolsMenuItemClass, "py-2.5")}
                          onClick={() => insertMentionToken(option)}
                        >
                          <span className={chatMobileToolsMenuItemTitleClass}>
                            {mentionOptionLabel(option)}
                          </span>
                          <span
                            className={cn(
                              chatMobileToolsMenuItemDescClass,
                              "line-clamp-2"
                            )}
                          >
                            {t("composerToolSignalDesc")}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {effectiveActiveTool ? (
                <Badge
                  variant="outline"
                  className={chatMobileComposerToolChipClass}
                >
                  {activeToolLabel}
                  <button
                    type="button"
                    aria-label={t("composerRemoveTool")}
                    className={chatMobileComposerToolChipCloseClass}
                    onClick={clearActiveTool}
                  >
                    <XIcon className="size-2.5 stroke-[2.25]" />
                  </button>
                </Badge>
              ) : null}
            </div>
            <Textarea
              ref={textareaNodeRef}
              value={composerValue}
              onChange={(event) => {
                const next = event.target.value
                const start = event.target.selectionStart
                syncMentionIndex(next, start)
                setValue(next)
                setCursor(start)
                requestAnimationFrame(syncFloatingComposerLayout)
              }}
              onKeyDown={onKeyDown}
              onKeyUp={syncCursor}
              onClick={syncCursor}
              onSelect={syncCursor}
              placeholder={
                effectiveActiveTool
                  ? t("composerToolSignalPlaceholder")
                  : t("composerMobilePlaceholder")
              }
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
                "[grid-area:field] min-w-0",
                floatingComposerExpanded
                  ? chatMobileComposerTextareaExpandedClass
                  : chatMobileComposerTextareaCompactClass
              )}
            />
            <div className={chatMobileComposerTrailingClass}>
              {showStop ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="default"
                  aria-label={t("composerStop")}
                  title={t("composerStopTitle")}
                  onClick={stop}
                  className={chatMobileComposerSendClass}
                >
                  <SquareIcon className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  variant={canSend ? "default" : "ghost"}
                  aria-label={t("composerSend")}
                  title={t("composerSendTitle")}
                  disabled={!canSend}
                  className={
                    canSend
                      ? chatMobileComposerSendClass
                      : chatDesktopComposerSendDisabledClass
                  }
                >
                  <ArrowUpIcon className={cn("size-4.5", !canSend && "opacity-50")} />
                </Button>
              )}
            </div>
          </>
        ) : (
        <div className="[grid-area:primary] flex min-h-11 flex-wrap items-start gap-1.5 px-3.5 pt-3.5 pb-1.5 sm:min-h-10">
          {effectiveActiveTool ? (
            <Badge
              variant="outline"
              className={chatDesktopComposerToolChipClass}
            >
              {activeToolLabel}
              <button
                type="button"
                aria-label={t("composerRemoveTool")}
                className={chatDesktopComposerToolChipCloseClass}
                onClick={clearActiveTool}
              >
                <XIcon className="size-3 stroke-[2.25]" />
              </button>
            </Badge>
          ) : null}
          <Textarea
            ref={textareaNodeRef}
            value={composerValue}
          onChange={(event) => {
            const next = event.target.value
            const start = event.target.selectionStart
            syncMentionIndex(next, start)
            setValue(next)
            setCursor(start)
          }}
            onKeyDown={onKeyDown}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onSelect={syncCursor}
            placeholder={
              effectiveActiveTool
                ? t("composerToolSignalPlaceholder")
                : t("composerPlaceholder")
            }
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
            className="chat-bidi min-h-6 min-w-32 flex-1 field-sizing-content resize-none rounded-none border-0 bg-transparent p-0 text-start text-base leading-6 shadow-none placeholder:text-muted-foreground/35 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-100 dark:bg-transparent dark:disabled:bg-transparent dark:placeholder:text-muted-foreground/30 sm:text-sm sm:leading-[1.45]"
          />
        </div>
        )}
        {!isFloating ? (
        <div className="[grid-area:leading] flex items-center gap-0.5 px-0.5 pb-0.5">
          {SHOW_COMPOSER_TOOLS_MENU ? (
            <DropdownMenu modal={isMobile ? false : undefined}>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("composerToolsMenu")}
                    title={t("composerToolsMenu")}
                    disabled={disabled}
                    className={chatDesktopComposerIconButtonClass}
                  />
                }
              >
                <PlusIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className={cn(chatMobileToolsMenuClass, "min-w-54 border-0 p-1.5 shadow-none ring-0 bg-white/78! dark:bg-white/8!")}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className={chatMobileToolsMenuLabelClass}>
                    {t("composerToolsMenu")}
                  </DropdownMenuLabel>
                  {IRIS_MENTION_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      className={cn(chatMobileToolsMenuItemClass, "py-2.5")}
                      onClick={() => insertMentionToken(option)}
                    >
                      <span className={chatMobileToolsMenuItemTitleClass}>
                        {mentionOptionLabel(option)}
                      </span>
                      <span className={cn(chatMobileToolsMenuItemDescClass, "line-clamp-2")}>
                        {t("composerToolSignalDesc")}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
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
                className="min-w-48"
                side={isMobile ? "bottom" : "top"}
              >
                <DropdownMenuGroup>
                  <p className="px-2 pb-1 pt-1.5 text-start text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {t("effort.label")}
                  </p>
                  {CHAT_EFFORT_OPTIONS.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      className="items-start py-2"
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
                        <CheckIcon className="mt-0.5 size-3.5" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        ) : null}
        {!isFloating ? (
        <div className="[grid-area:trailing] flex items-center justify-end px-1 pb-0.5">
          {showStop ? (
            <Button
              type="button"
              size="icon"
              variant="default"
              aria-label={t("composerStop")}
              title={t("composerStopTitle")}
              onClick={stop}
              className={chatDesktopComposerSendClass}
            >
              <SquareIcon className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              variant={canSend ? "default" : "ghost"}
              aria-label={t("composerSend")}
              title={t("composerSendTitle")}
              disabled={!canSend}
              className={
                canSend
                  ? chatDesktopComposerSendClass
                  : chatDesktopComposerSendDisabledClass
              }
            >
              <ArrowUpIcon className={canSend ? undefined : "opacity-50"} />
            </Button>
          )}
        </div>
        ) : null}
      </div>
      {!isFloating ? (
        <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground/70">
          {t("composerHint")}
        </p>
      ) : null}
    </form>
  )
}

export { ChatComposer }
