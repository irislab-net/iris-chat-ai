"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
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
  chatEffortLabel,
  DEFAULT_CHAT_EFFORT,
  type ChatEffort,
} from "@/lib/chat-effort"
import {
  applyMentionSelection,
  expandComposerDraft,
  expandComposerMentions,
  filterMentionOptions,
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
  chatMobileComposerPillClass,
  chatMobileComposerSendClass,
  chatMobileComposerShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

type ChatComposerProps = {
  onSend?: (message: string) => void
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
  const [uncontrolled, setUncontrolled] = React.useState("")
  const [activeTool, setActiveTool] = React.useState<IrisMentionTool | null>(null)
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const [cursor, setCursor] = React.useState(0)
  const localRef = React.useRef<HTMLTextAreaElement>(null)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolled
  const canSend = !disabled && value.trim().length > 0
  const textareaNodeRef = React.useMemo(
    () => mergeRefs(localRef, textareaRef),
    [textareaRef]
  )

  const mentionPalette = React.useMemo(() => {
    if (activeTool) return null
    return parseMentionPalette(value, cursor)
  }, [activeTool, value, cursor])

  const mentionOptions = React.useMemo(
    () =>
      mentionPalette ? filterMentionOptions(mentionPalette.query) : [],
    [mentionPalette]
  )

  const mentionOpen = Boolean(mentionPalette && mentionOptions.length > 0)

  const focusComposer = React.useCallback(
    (options?: { force?: boolean }) => {
      const el = localRef.current
      if (!el) return
      if (isDesktop !== true && !options?.force) return
      if (deferMobileKeyboard && !mobileKeyboardReady && !options?.force) return
      try {
        el.focus({ preventScroll: true })
      } catch {
        el.focus()
      }
    },
    [deferMobileKeyboard, isDesktop, mobileKeyboardReady]
  )

  const enableMobileKeyboard = React.useCallback(() => {
    if (!deferMobileKeyboard) return
    setUserUnlockedKeyboard(true)
    queueMicrotask(() => focusComposer({ force: true }))
  }, [deferMobileKeyboard, focusComposer])

  function syncMentionIndex(nextValue: string, selectionStart: number) {
    if (activeTool) return
    const nextPalette = parseMentionPalette(nextValue, selectionStart)
    const prevPalette = parseMentionPalette(value, cursor)
    if (nextPalette?.query !== prevPalette?.query) {
      setMentionIndex(0)
    }
  }

  function syncCursor() {
    const next = localRef.current?.selectionStart ?? value.length
    setCursor(next)
  }

  function setValue(next: string) {
    const parsed = parseComposerToolTag(next)
    if (parsed) {
      setActiveTool(parsed.tool)
      if (!isControlled) setUncontrolled(parsed.text)
      onValueChange?.(parsed.text)
      return
    }

    if (!isControlled) setUncontrolled(next)
    onValueChange?.(next)
  }

  function send() {
    if (disabled) return
    const expanded = activeTool
      ? expandComposerDraft({ tool: activeTool, text: value.trim() })
      : expandComposerMentions(value.trim())
    if (!expanded) return
    onSend?.(expanded)
    setActiveTool(null)
    if (!isControlled) setUncontrolled("")
    onValueChange?.("")
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
    setActiveTool(null)
    focusComposer()
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
      activeTool &&
      value.length === 0 &&
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
      className={cn(
        "relative shrink-0",
        isFloating
          ? chatMobileComposerShellClass
          : "bg-linear-to-t from-sidebar via-sidebar to-sidebar/80 px-3 pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        send()
      }}
    >
      {mentionOpen ? (
        <div
          className="absolute inset-x-3 bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg"
          role="listbox"
          aria-label={t("composerMentionMenu")}
        >
          <p className="border-b border-border/50 px-3 py-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
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
                    "flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    index === mentionIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/60"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    applyMention(option)
                  }}
                >
                  <span className="text-[13px] font-medium">{option.label}</span>
                  <span className="text-[11px] text-muted-foreground">
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
        className={cn(
          "cursor-text transition-[background-color,box-shadow,border-color]",
          isFloating
            ? chatMobileComposerPillClass
            : cn(
                "grid grid-cols-[auto_1fr_auto] rounded-2xl border border-foreground/[0.06] bg-muted/25 px-1 pb-1.5",
                "shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_7%,transparent),0_10px_28px_-20px_color-mix(in_oklch,var(--foreground)_14%,transparent)]",
                "[grid-template-areas:'primary_primary_primary'_'leading_._trailing']",
                "focus-within:border-foreground/10 focus-within:bg-muted/38",
                "focus-within:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_11%,transparent),0_14px_36px_-18px_color-mix(in_oklch,var(--foreground)_18%,transparent)]"
              )
        )}
        onClick={focusField}
        onPointerDown={(event) => {
          if (!deferMobileKeyboard || mobileKeyboardReady) return
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("button, [role='menu'], [data-mention-item]")
          ) {
            return
          }
          enableMobileKeyboard()
        }}
      >
        {isFloating ? (
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
                  className={chatMobileComposerIconButtonClass}
                />
              }
            >
              <PlusIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-medium tracking-wide uppercase">
                  {t("composerToolsMenu")}
                </DropdownMenuLabel>
                {IRIS_MENTION_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="flex-col items-start gap-0.5 py-2"
                    onClick={() => insertMentionToken(option)}
                  >
                    <span className="text-[13px] font-medium">{option.label}</span>
                    <span className="line-clamp-2 text-[11px] text-muted-foreground">
                      {t("composerToolSignalDesc")}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <div
          className={cn(
            isFloating
              ? "flex min-w-0 flex-1 items-end gap-1 px-0.5 pb-0.5"
              : "[grid-area:primary] flex min-h-11 flex-wrap items-start gap-1.5 px-3.5 pt-3.5 pb-1.5 sm:min-h-10"
          )}
        >
          {activeTool ? (
            <Badge
              variant="secondary"
              className="mt-0.5 h-6 shrink-0 gap-1 rounded-md border border-primary/15 bg-primary/10 px-2 py-0 text-[12px] font-medium text-primary"
            >
              {activeTool}
              <button
                type="button"
                aria-label={t("composerRemoveTool")}
                className="rounded-sm text-primary/70 transition-colors hover:text-primary"
                onClick={clearActiveTool}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ) : null}
          <Textarea
            ref={textareaNodeRef}
            value={value}
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
              activeTool
                ? t("composerToolSignalPlaceholder")
                : isFloating
                  ? t("composerMobilePlaceholder")
                  : t("composerPlaceholder")
            }
            rows={1}
            disabled={disabled}
            readOnly={deferMobileKeyboard && !mobileKeyboardReady}
            enterKeyHint="send"
            onFocus={(event) => {
              if (deferMobileKeyboard && !mobileKeyboardReady) {
                event.currentTarget.blur()
                return
              }
              if (isFloating) onFloatingFocusChange?.(true)
            }}
            onBlur={() => {
              if (isFloating) onFloatingFocusChange?.(false)
            }}
            dir={textDir}
            className={cn(
              "chat-bidi min-w-[8rem] flex-1 field-sizing-content resize-none rounded-none border-0 bg-transparent p-0 text-start shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent",
              isFloating
                ? "max-h-40 min-h-11 py-2.5 text-[16px] leading-6 text-foreground placeholder:text-muted-foreground"
                : "min-h-6 text-[16px] leading-6 sm:text-[14px] sm:leading-[1.45]"
            )}
          />
        </div>
        {isFloating ? (
          <div className="flex shrink-0 items-end pb-0.5 pe-0.5">
            {canSend ? (
              <Button
                type="submit"
                size="icon-sm"
                variant="default"
                aria-label="Send message"
                title="Send · Enter"
                className={chatMobileComposerSendClass}
              >
                <ArrowUpIcon className="size-[18px]" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {!isFloating ? (
        <div className="[grid-area:leading] flex items-center gap-0.5 px-0.5 pb-0.5">
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
                  className="size-9 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:size-8"
                />
              }
            >
              <PlusIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-medium tracking-wide uppercase">
                  {t("composerToolsMenu")}
                </DropdownMenuLabel>
                {IRIS_MENTION_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="flex-col items-start gap-0.5 py-2"
                    onClick={() => insertMentionToken(option)}
                  >
                    <span className="text-[13px] font-medium">{option.label}</span>
                    <span className="line-clamp-2 text-[11px] text-muted-foreground">
                      {t("composerToolSignalDesc")}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {!hideEffort ? (
            <DropdownMenu modal={isMobile ? false : undefined}>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Response depth: ${chatEffortLabel(effort)}`}
                    className="h-9 gap-1 rounded-lg bg-muted/35 px-2.5 text-[12px] text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-8"
                  />
                }
              >
                {chatEffortLabel(effort)}
                <ChevronDownIcon className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-48"
                side={isMobile ? "bottom" : "top"}
              >
                <DropdownMenuGroup>
                  <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Response depth
                  </p>
                  {CHAT_EFFORT_OPTIONS.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      className="items-start py-2"
                      onClick={() => onEffortChange?.(item.value)}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[13px]">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.hint}
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
          <Button
            type="submit"
            size="icon"
            variant={canSend ? "default" : "ghost"}
            aria-label="Send message"
            title="Send · Enter"
            disabled={!canSend}
            className={cn(
              "size-10 rounded-full transition-transform sm:size-9",
              canSend && "shadow-sm"
            )}
          >
            <ArrowUpIcon />
          </Button>
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
