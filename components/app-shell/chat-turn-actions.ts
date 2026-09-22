/** Message toolbar row — always visible under each turn. */
const chatTurnActionsClass = "flex items-center gap-0.5"

const chatTurnActionButtonClass =
  "size-7 text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"

/** Reveal copy/edit controls on hover or keyboard focus (always visible on touch). */
const chatUserTurnActionsRevealClass =
  "opacity-100 transition-opacity duration-150 [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/user-turn:pointer-events-auto [@media(hover:hover)]:group-hover/user-turn:opacity-100 [@media(hover:hover)]:group-focus-within/user-turn:pointer-events-auto [@media(hover:hover)]:group-focus-within/user-turn:opacity-100"

/** Gemini-style user bubble — soft gray in light mode, elevated surface in dark. */
const chatUserBubbleClass =
  "rounded-[24px] bg-muted/90 px-4 py-3 text-sm leading-[1.55] text-foreground outline-none transition-[background-color] duration-150 hover:bg-muted focus-within:bg-muted sm:text-[13px] [&::selection]:bg-foreground/10 dark:border dark:border-border/50 dark:bg-secondary dark:text-foreground dark:hover:bg-secondary/90 dark:focus-within:bg-secondary/90 dark:[&::selection]:bg-foreground/15"

const chatUserBubbleInlineActionClass =
  "size-7 text-muted-foreground hover:bg-foreground/5 hover:text-foreground dark:text-muted-foreground dark:hover:bg-foreground/5 dark:hover:text-foreground"

const chatUserBubbleExpandToggleClass =
  "h-auto min-h-0 w-auto gap-0.5 px-0 py-0 text-xs font-medium text-muted-foreground underline-offset-2 hover:bg-transparent hover:text-foreground hover:underline dark:text-muted-foreground dark:hover:bg-transparent dark:hover:text-foreground"

export {
  chatTurnActionButtonClass,
  chatTurnActionsClass,
  chatUserBubbleClass,
  chatUserBubbleExpandToggleClass,
  chatUserBubbleInlineActionClass,
  chatUserTurnActionsRevealClass,
}
