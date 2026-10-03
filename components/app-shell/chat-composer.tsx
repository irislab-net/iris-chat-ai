"use client"

import * as React from "react"
import {
  ActivityIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  FileCode2Icon,
  FileTextIcon,
  LineChartIcon,
  LockIcon,
  MicIcon,
  PlusIcon,
  SquareIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react"
// Paperclip/upload stays out of the + menu until real file attach ships.
import { useLocale, useTranslations } from "next-intl"
import {
  dismissAppToast,
  showAppErrorToast,
  showAppToast,
} from "@/components/ui/app-toast"

import {
  chatContextMenuContentClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { ComposerPremiumToolsDialog } from "@/components/app-shell/composer-premium-tools-dialog"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  CHAT_EFFORT_OPTIONS,
  DEFAULT_CHAT_EFFORT,
  type ChatEffort,
} from "@/lib/chat-effort"
import {
  applyMentionSelection,
  composerInputDirection,
  expandComposerMentions,
  filterComposerPaletteTools,
  IRIS_MENTION_OPTIONS,
  mentionTokenForTool,
  parseMentionPalette,
  splitComposerMentionHighlights,
  type ComposerPaletteTool,
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
import {
  localeDirection,
  localeLabelKey,
  speechLocale,
} from "@/lib/i18n/locale"
import type { AppLocale } from "@/i18n/routing"
import { mergeRefs } from "@/lib/merge-refs"
import {
  chatMobileComposerIconButtonClass,
  chatMobileComposerIconButtonCompactClass,
  chatMobileComposerVoiceListeningClass,
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
  chatComposerLiquidDockCardClass,
  chatComposerLiquidSheetClass,
  chatComposerLiquidSheetOverlayClass,
  chatComposerLiquidSheetRowActiveClass,
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
  chatMobileComposerShellClass,
  chatMobileSheetHandleClass,
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

/**
 * Typing `/` mention — full-bleed liquid sheet behind the composer pill.
 * Must stay inside the composer stacking context so the pill (z-10) paints above.
 */
const composerMentionBackdropSheetClass = cn(
  chatComposerLiquidSheetClass,
  "pointer-events-auto fixed inset-x-0 bottom-(--keyboard-inset-bottom,0px) z-1 flex flex-col"
)

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
  /** Plus users see “Coming soon” for locked premium tools. */
  isProUser?: boolean
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
  isProUser = false,
}: ChatComposerProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const locale = useLocale()
  const textDir = localeDirection(locale)
  const isDesktop = useIsDesktop()
  const isMobile = isDesktop === false
  const isFloating = layout === "floating"
  const deferMobileKeyboard = isFloating && isDesktop !== true
  const [userUnlockedKeyboard, setUserUnlockedKeyboard] = React.useState(false)
  const mobileKeyboardReady = !deferMobileKeyboard || userUnlockedKeyboard
  /** Ignore ghost taps when chat mounts under the finger (click retargeting). */
  const keyboardUnlockAllowedAtRef = React.useRef(0)
  const [uncontrolled, setUncontrolled] = React.useState("")
  const [premiumToolsOpen, setPremiumToolsOpen] = React.useState(false)
  const [toolsSheetOpen, setToolsSheetOpen] = React.useState(false)
  const [mentionSuppressed, setMentionSuppressed] = React.useState(false)
  const [pasteAttachments, setPasteAttachments] = React.useState<
    ComposerPasteAttachment[]
  >([])
  const [mentionIndex, setMentionIndex] = React.useState(0)

  function openPremiumTools() {
    setToolsSheetOpen(false)
    // Hide `/` sheet so it does not sit under the premium dialog.
    setMentionSuppressed(true)
    setPremiumToolsOpen(true)
  }

  function closeToolsSheet() {
    setToolsSheetOpen(false)
  }
  const [cursor, setCursor] = React.useState(0)
  const localRef = React.useRef<HTMLTextAreaElement>(null)
  const highlightRef = React.useRef<HTMLDivElement>(null)
  /** Stable compact column width — expanded layout is full-width and must not drive collapse. */
  const compactFieldWidthRef = React.useRef(0)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolled
  const composerValue = value
  const composerValueRef = React.useRef(composerValue)
  composerValueRef.current = composerValue
  /**
   * Textarea + mention mirror must share one dir. Use first-strong (like
   * `dir="auto"`) — ChatGPT/Gemini avoid this class of bug by putting chips
   * in a real contenteditable; our mirror overlay cannot invent a second bidi.
   */
  const inputDir = composerInputDirection(composerValue, textDir)
  const signalToolLabel = t("composerToolSignalLabel")
  function mentionOptionLabel(option: IrisMentionOption) {
    return option.tool === "signal" ? signalToolLabel : option.label
  }
  const mentionHighlightParts = React.useMemo(
    () => splitComposerMentionHighlights(composerValue),
    [composerValue]
  )
  // Keep chip while typing Persian after `/Signal` — that is the normal FA flow.
  const hasMentionHighlight = mentionHighlightParts.some(
    (part) => part.type === "mention"
  )

  function selectToolsMention(option: IrisMentionOption) {
    closeToolsSheet()
    insertMentionToken(option)
  }

  const toolsRows = (
    <div className="flex flex-col gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-1">
      {IRIS_MENTION_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={chatComposerLiquidSheetRowClass}
          onClick={() => selectToolsMention(option)}
        >
          <span className={chatComposerLiquidSheetRowIconClass}>
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
        </button>
      ))}
      <button
        type="button"
        className={chatComposerLiquidSheetRowClass}
        onClick={openPremiumTools}
      >
        <span className={chatComposerLiquidSheetRowIconClass}>
          <LineChartIcon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className={chatMobileToolsMenuItemTitleClass}>
            {t("composerToolCorrelationLabel")}
          </span>
        </span>
        <LockIcon
          className="size-4 shrink-0 text-muted-foreground/70"
          aria-hidden
        />
      </button>
      <button
        type="button"
        className={chatComposerLiquidSheetRowClass}
        onClick={openPremiumTools}
      >
        <span className={chatComposerLiquidSheetRowIconClass}>
          <ActivityIcon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className={chatMobileToolsMenuItemTitleClass}>
            {t("composerToolVolatilityLabel")}
          </span>
        </span>
        <LockIcon
          className="size-4 shrink-0 text-muted-foreground/70"
          aria-hidden
        />
      </button>
    </div>
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
        className={cn(
          chatMobileToolsMenuItemClass,
          "flex-row items-center gap-3 py-2.5"
        )}
        onClick={openPremiumTools}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground dark:bg-white/8">
          <LineChartIcon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className={chatMobileToolsMenuItemTitleClass}>
            {t("composerToolCorrelationLabel")}
          </span>
          <LockIcon
            className="ms-auto size-3.5 shrink-0 text-muted-foreground/70"
            aria-hidden
          />
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem
        className={cn(
          chatMobileToolsMenuItemClass,
          "flex-row items-center gap-3 py-2.5"
        )}
        onClick={openPremiumTools}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground/5 text-foreground dark:bg-white/8">
          <ActivityIcon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className={chatMobileToolsMenuItemTitleClass}>
            {t("composerToolVolatilityLabel")}
          </span>
          <LockIcon
            className="ms-auto size-3.5 shrink-0 text-muted-foreground/70"
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
  const mentionPaletteKey = mentionPalette
    ? `${mentionPalette.replaceStart}:${mentionPalette.query}`
    : ""

  React.useEffect(() => {
    setMentionSuppressed(false)
    setMentionIndex(0)
  }, [mentionPaletteKey])

  const paletteLabels = React.useMemo(
    () => ({
      signal: t("composerToolSignalLabel"),
      correlation: t("composerToolCorrelationLabel"),
      volatility: t("composerToolVolatilityLabel"),
    }),
    [t]
  )

  const paletteTools = React.useMemo(
    () =>
      mentionPalette
        ? filterComposerPaletteTools(mentionPalette.query, paletteLabels)
        : [],
    [mentionPalette, paletteLabels]
  )

  const mentionOpen = Boolean(
    mentionPalette && paletteTools.length > 0 && !mentionSuppressed
  )
  const safeMentionIndex =
    paletteTools.length === 0
      ? 0
      : Math.min(mentionIndex, paletteTools.length - 1)
  const activeMentionOptionId = paletteTools[safeMentionIndex]?.id

  React.useEffect(() => {
    if (mentionIndex !== safeMentionIndex) {
      setMentionIndex(safeMentionIndex)
    }
  }, [mentionIndex, safeMentionIndex])

  function selectPaletteTool(tool: ComposerPaletteTool) {
    if (tool.locked || !tool.mention) {
      openPremiumTools()
      return
    }
    applyMention(tool.mention)
  }
  const [listening, setListening] = React.useState(false)
  /** Bumps on stop so a dying SpeechRecognition can't block the next hold. */
  const voiceSessionRef = React.useRef(0)
  const recognitionRef = React.useRef<{
    stop: () => void
    abort: () => void
    start: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onresult: ((event: any) => void) | null
    onerror: ((event: { error?: string }) => void) | null
    onend: (() => void) | null
    lang: string
    continuous: boolean
    interimResults: boolean
  } | null>(null)
  const VOICE_LISTENING_TOAST_ID = "composer-voice-listening"
  const VOICE_ERROR_TOAST_ID = "composer-voice-error"

  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(
      (
        window as unknown as {
          SpeechRecognition?: unknown
          webkitSpeechRecognition?: unknown
        }
      ).SpeechRecognition ||
        (
          window as unknown as {
            SpeechRecognition?: unknown
            webkitSpeechRecognition?: unknown
          }
        ).webkitSpeechRecognition
    )

  function stopVoiceInput() {
    dismissAppToast(VOICE_LISTENING_TOAST_ID)
    voiceSessionRef.current += 1
    const recognition = recognitionRef.current
    recognitionRef.current = null
    setListening(false)
    if (!recognition) return
    try {
      recognition.stop()
    } catch {
      recognition.abort()
    }
  }

  function showVoiceError(
    title: string,
    description: string,
    icon: "mic-off" | "globe" | "wifi-off" | "info" = "mic-off"
  ) {
    dismissAppToast(VOICE_LISTENING_TOAST_ID)
    showAppErrorToast({
      id: VOICE_ERROR_TOAST_ID,
      title,
      description,
      icon,
    })
  }

  function startVoiceInput() {
    if (disabled || sending || listening || recognitionRef.current) return
    type SpeechCtor = new () => NonNullable<typeof recognitionRef.current>
    const Ctor =
      (
        window as unknown as {
          SpeechRecognition?: SpeechCtor
          webkitSpeechRecognition?: SpeechCtor
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: SpeechCtor
          webkitSpeechRecognition?: SpeechCtor
        }
      ).webkitSpeechRecognition
    if (!Ctor) {
      showVoiceError(
        t("composerVoiceUnavailableTitle"),
        t("composerVoiceUnavailable")
      )
      return
    }

    const session = voiceSessionRef.current + 1
    voiceSessionRef.current = session
    const recognition = new Ctor()
    // BCP-47 tag required (fa → fa-IR); bare "fa" breaks Persian STT in Chrome.
    recognition.lang = speechLocale(locale)
    // Hold-to-talk: keep listening until the user releases.
    recognition.continuous = true
    recognition.interimResults = true
    // Commit each final result once — stop() often re-emits the last final.
    let nextResultIndex = 0
    recognition.onresult = (event) => {
      if (voiceSessionRef.current !== session) return
      const results = event.results
      if (!results) return
      for (let i = nextResultIndex; i < results.length; i += 1) {
        const result = results[i]
        if (!result?.isFinal) continue
        nextResultIndex = i + 1
        const transcript = result[0]?.transcript?.trim()
        if (!transcript) continue
        const current = composerValueRef.current
        const el = localRef.current
        const start = el?.selectionStart ?? current.length
        const end = el?.selectionEnd ?? start
        const spacer =
          start > 0 && !/\s$/.test(current.slice(0, start)) ? " " : ""
        const next = `${current.slice(0, start)}${spacer}${transcript}${current.slice(end)}`
        setValue(next)
        placeCaret(start + spacer.length + transcript.length)
      }
    }
    recognition.onerror = (event: { error?: string } | null) => {
      const stale = voiceSessionRef.current !== session
      if (!stale) {
        setListening(false)
        recognitionRef.current = null
      }
      const code = event?.error
      if (code === "aborted" || code === "no-speech") {
        if (!stale) dismissAppToast(VOICE_LISTENING_TOAST_ID)
        return
      }
      if (stale) return
      if (
        code === "language-not-supported" ||
        code === "service-not-allowed"
      ) {
        showVoiceError(
          t("composerVoiceLanguageUnsupportedTitle"),
          t("composerVoiceLanguageUnsupported", {
            language: common(localeLabelKey(locale as AppLocale)),
          }),
          "globe"
        )
        return
      }
      if (code === "not-allowed") {
        showVoiceError(
          t("composerVoicePermissionDeniedTitle"),
          t("composerVoicePermissionDenied")
        )
        return
      }
      if (code === "audio-capture") {
        showVoiceError(
          t("composerVoiceMicMissingTitle"),
          t("composerVoiceMicMissing")
        )
        return
      }
      if (code === "network") {
        showVoiceError(
          t("composerVoiceNetworkErrorTitle"),
          t("composerVoiceNetworkError"),
          "wifi-off"
        )
        return
      }
      showVoiceError(
        t("composerVoiceUnavailableTitle"),
        t("composerVoiceUnavailable")
      )
    }
    recognition.onend = () => {
      if (voiceSessionRef.current !== session) return
      setListening(false)
      recognitionRef.current = null
      dismissAppToast(VOICE_LISTENING_TOAST_ID)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      showAppToast({
        id: VOICE_LISTENING_TOAST_ID,
        title: t("composerVoiceListeningTitle"),
        description: t("composerVoiceListening"),
        icon: "mic",
        duration: Number.POSITIVE_INFINITY,
      })
    } catch {
      recognitionRef.current = null
      setListening(false)
      showVoiceError(
        t("composerVoiceUnavailableTitle"),
        t("composerVoiceUnavailable")
      )
    }
  }

  function handleVoicePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || disabled || sending) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    startVoiceInput()
  }

  function handleVoicePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    stopVoiceInput()
  }

  function handleVoiceKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    if (!event.repeat) startVoiceInput()
  }

  function handleVoiceKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    stopVoiceInput()
  }

  React.useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  React.useEffect(() => {
    if (!toolsSheetOpen) return
    stopVoiceInput()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeToolsSheet()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toolsSheetOpen])

  React.useEffect(() => {
    if (mentionOpen) closeToolsSheet()
  }, [mentionOpen])

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
    stopVoiceInput()
    closeToolsSheet()
    setMentionSuppressed(true)
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
    if (pasteAttachments.length >= PASTE_ATTACHMENT_MAX) {
      event.preventDefault()
      showAppToast({
        title: t("composerPasteAttachmentMaxTitle"),
        description: t("composerPasteAttachmentMax", {
          count: PASTE_ATTACHMENT_MAX,
        }),
        icon: "info",
      })
      return
    }
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
        setMentionIndex((index) => (index + 1) % paletteTools.length)
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setMentionIndex(
          (index) => (index - 1 + paletteTools.length) % paletteTools.length
        )
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        const tool = paletteTools[safeMentionIndex]
        if (tool) selectPaletteTool(tool)
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setMentionSuppressed(true)
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

  /** `/` typing on mobile: sheet behind composer. `+` menu: modal sheet on top. */
  const floatingMentionBehind = isFloating && mentionOpen && !toolsSheetOpen
  const formRef = React.useRef<HTMLFormElement>(null)
  const [composerDockHeight, setComposerDockHeight] = React.useState(96)

  function dismissFloatingDock() {
    closeToolsSheet()
    if (mentionOpen) setMentionSuppressed(true)
  }

  React.useLayoutEffect(() => {
    if (!floatingMentionBehind) return
    const el = formRef.current
    if (!el) return
    const sync = () => {
      setComposerDockHeight(Math.ceil(el.getBoundingClientRect().height))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [
    floatingMentionBehind,
    floatingComposerExpanded,
    pasteAttachments.length,
    composerValue,
  ])

  const floatingMentionList = (
    <ul className="flex flex-col gap-0.5 px-3 pb-2 pt-0.5">
      {paletteTools.map((tool, index) => {
        const Icon =
          tool.id === "correlation"
            ? LineChartIcon
            : tool.id === "volatility"
              ? ActivityIcon
              : TrendingUpIcon
        return (
          <li key={tool.id}>
            <button
              type="button"
              id={`composer-mention-${tool.id}`}
              data-mention-item=""
              role="option"
              aria-selected={index === safeMentionIndex}
              className={cn(
                chatComposerLiquidSheetRowClass,
                "py-2.5",
                index === safeMentionIndex &&
                  chatComposerLiquidSheetRowActiveClass
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                selectPaletteTool(tool)
              }}
            >
              <span
                className={cn(
                  chatComposerLiquidSheetRowIconClass,
                  "size-8 [&_svg]:size-3.5"
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.016em] text-foreground">
                {paletteLabels[tool.id]}
              </span>
              {tool.locked ? (
                <LockIcon
                  className="size-3.5 shrink-0 text-muted-foreground/65"
                  aria-hidden
                />
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <form
      ref={formRef}
      data-slot="chat-composer"
      dir={textDir}
      className={cn(
        "relative shrink-0",
        isFloating
          ? chatMobileComposerShellClass
          : chatDesktopComposerShellClass,
        // Isolate so the mention sheet (z-1) stays under the pill (z-10).
        floatingMentionBehind && "z-30",
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
      {isFloating ? (
        <Sheet
          open={toolsSheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeToolsSheet()
              queueMicrotask(() => focusComposer({ force: true }))
            }
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            overlayClassName={chatComposerLiquidSheetOverlayClass}
            className={chatComposerLiquidSheetClass}
          >
            <SheetTitle className="sr-only">{t("composerToolsMenu")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("composerToolsMenu")}
            </SheetDescription>
            <div className={chatMobileSheetHandleClass} aria-hidden />
            <p className={cn(chatMobileToolsMenuLabelClass, "px-5")}>
              {t("composerToolsMenu")}
            </p>
            {toolsRows}
          </SheetContent>
        </Sheet>
      ) : null}

      {floatingMentionBehind ? (
        <>
          <div
            role="presentation"
            className={cn(
              "fixed inset-0 z-0 touch-none",
              chatComposerLiquidSheetOverlayClass
            )}
            onClick={dismissFloatingDock}
          />
          <div
            id="composer-mention-listbox"
            role="listbox"
            aria-label={t("composerMentionMenu")}
            aria-activedescendant={
              activeMentionOptionId
                ? `composer-mention-${activeMentionOptionId}`
                : undefined
            }
            className={composerMentionBackdropSheetClass}
            style={{ paddingBottom: composerDockHeight }}
          >
            <div className={chatMobileSheetHandleClass} aria-hidden />
            <p className={cn(chatMobileToolsMenuLabelClass, "px-5")}>
              {t("composerMentionMenu")}
            </p>
            {floatingMentionList}
          </div>
        </>
      ) : null}

      {!isFloating && mentionOpen ? (
        <div
          id="composer-mention-listbox"
          className={cn(
            "absolute inset-x-3 bottom-full z-20 mb-2 min-w-60 max-w-[min(100vw-1.5rem,20rem)]",
            chatComposerLiquidDockCardClass
          )}
          role="listbox"
          aria-label={t("composerMentionMenu")}
          aria-activedescendant={
            activeMentionOptionId
              ? `composer-mention-${activeMentionOptionId}`
              : undefined
          }
        >
          <p className={chatMobileToolsMenuLabelClass}>
            {t("composerMentionMenu")}
          </p>
          {floatingMentionList}
        </div>
      ) : null}

      <div
        data-composer-body=""
        data-composer-expanded={floatingComposerExpanded ? "" : undefined}
        data-composer-multiline={floatingPastSingleLine ? "" : undefined}
        className={cn(
          "relative z-10 cursor-text transition-[background-color,box-shadow,border-color]",
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
                <ActionTooltip label={t("composerToolsMenu")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("composerToolsMenu")}
                    aria-expanded={toolsSheetOpen}
                    aria-haspopup="dialog"
                    disabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation()
                      setToolsSheetOpen((open) => !open)
                    }}
                    className={
                      floatingComposerExpanded
                        ? chatMobileComposerIconButtonClass
                        : chatMobileComposerIconButtonCompactClass
                    }
                  >
                    {toolsSheetOpen ? (
                      <XIcon className="size-5" />
                    ) : (
                      <PlusIcon className="size-5" />
                    )}
                  </Button>
                </ActionTooltip>
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
                  dir={inputDir}
                  className={cn(
                    chatMobileComposerTextareaClass,
                    "pointer-events-none absolute inset-0 z-0 overflow-hidden break-words text-foreground",
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
                dir={inputDir}
                className={cn(
                  chatMobileComposerTextareaClass,
                  // `block` overrides Textarea's default `flex`, which misaligns
                  // the caret vs the mention mirror overlay on mobile Safari.
                  "relative z-10 block min-w-0 caret-foreground",
                  floatingComposerExpanded
                    ? chatMobileComposerTextareaExpandedClass
                    : chatMobileComposerTextareaCompactClass,
                  hasMentionHighlight &&
                    "text-transparent [-webkit-text-fill-color:transparent]"
                )}
              />
            </div>
            <div className={chatMobileComposerTrailingClass}>
              {speechSupported && !showStop ? (
                <ActionTooltip
                  label={
                    listening
                      ? t("composerVoiceListening")
                      : t("composerVoiceInput")
                  }
                >
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={
                      listening
                        ? t("composerVoiceListening")
                        : t("composerVoiceInput")
                    }
                    aria-pressed={listening}
                    disabled={disabled}
                    onPointerDown={handleVoicePointerDown}
                    onPointerUp={handleVoicePointerUp}
                    onPointerCancel={handleVoicePointerUp}
                    onKeyDown={handleVoiceKeyDown}
                    onKeyUp={handleVoiceKeyUp}
                    onContextMenu={(event) => event.preventDefault()}
                    className={cn(
                      "touch-none select-none",
                      listening
                        ? chatMobileComposerVoiceListeningClass
                        : floatingComposerExpanded
                          ? chatMobileComposerIconButtonClass
                          : chatMobileComposerIconButtonCompactClass
                    )}
                  >
                    <MicIcon className="size-4.5" />
                  </Button>
                </ActionTooltip>
              ) : null}
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
                  dir={inputDir}
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
                dir={inputDir}
                className={cn(
                  chatDesktopComposerTextareaClass,
                  "relative z-10 block whitespace-pre-wrap caret-foreground",
                  hasMentionHighlight &&
                    "text-transparent [-webkit-text-fill-color:transparent]"
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
                  side={isMobile ? "bottom" : "top"}
                  sideOffset={8}
                  showBackdrop
                  backdropClassName="bg-black/8 supports-backdrop-filter:bg-black/[0.04] supports-backdrop-filter:backdrop-blur-xs dark:bg-black/30 dark:supports-backdrop-filter:bg-black/20"
                  className={cn(chatContextMenuContentClass, "min-w-48")}
                >
                  <DropdownMenuGroup>
                    {CHAT_EFFORT_OPTIONS.map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        className={cn(
                          chatContextMenuItemClass,
                          "items-center gap-2.5"
                        )}
                        onClick={() => onEffortChange?.(item.value)}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                          <span className="text-[15px] font-medium leading-5 tracking-[-0.016em]">
                            {t(`effort.${item.value}`)}
                          </span>
                          <span className="text-[13px] font-normal leading-4.5 tracking-[-0.006em] text-muted-foreground">
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
          <div className="flex items-center justify-end gap-1 px-1 pb-0.5 [grid-area:trailing]">
            {speechSupported && !showStop ? (
              <ActionTooltip
                label={
                  listening
                    ? t("composerVoiceListening")
                    : t("composerVoiceInput")
                }
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={
                    listening
                      ? t("composerVoiceListening")
                      : t("composerVoiceInput")
                  }
                  aria-pressed={listening}
                  disabled={disabled}
                  onPointerDown={handleVoicePointerDown}
                  onPointerUp={handleVoicePointerUp}
                  onPointerCancel={handleVoicePointerUp}
                  onKeyDown={handleVoiceKeyDown}
                  onKeyUp={handleVoiceKeyUp}
                  onContextMenu={(event) => event.preventDefault()}
                  className={cn(
                    "touch-none select-none",
                    listening
                      ? chatMobileComposerVoiceListeningClass
                      : chatDesktopComposerIconButtonClass
                  )}
                >
                  <MicIcon className="size-4" />
                </Button>
              </ActionTooltip>
            ) : null}
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
      <ComposerPremiumToolsDialog
        open={premiumToolsOpen}
        onOpenChange={(open) => {
          setPremiumToolsOpen(open)
          // Restore `/` suggestions after the premium dialog closes.
          if (!open) setMentionSuppressed(false)
        }}
        isProUser={isProUser}
        feature="premium-tools"
      />
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
          // Keep font-weight/padding identical to the textarea so the caret
          // stays aligned with the mirror. Do not use `text-primary` — in this
          // theme primary is near-black and the mention disappears.
          <span
            key={`mention-${index}`}
            // Color/background only — never unicode-bidi/padding. The caret
            // lives in the transparent textarea; any bidi isolate here desyncs it.
            className="rounded-[0.3em] bg-[#2563EB]/14 font-normal text-[#2563EB] [box-decoration-break:clone] box-decoration-clone dark:bg-[#60A5FA]/20 dark:text-[#93C5FD]"
          >
            {part.value}
          </span>
        ) : (
          <span key={`text-${index}`} className="font-normal text-foreground">
            {part.value}
          </span>
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
