"use client"

/**
 * Shared visual language for pre-trace terminal + Thought process accordion.
 * Peer pattern (ChatGPT / Gemini): muted status chrome above the answer —
 * shimmer while live, collapse to a quiet receipt when done.
 */
export const chatThinkingShellClass = "mb-2 w-full min-w-0"

export const chatThinkingRowClass =
  "flex min-w-0 w-full items-center gap-2 rounded-md px-1 py-1 text-[13px] font-normal tracking-tight text-muted-foreground"

export const chatThinkingSpinnerClass =
  "size-3.5 shrink-0 animate-spin text-muted-foreground/80"

export const chatThinkingLabelClass =
  "min-w-0 flex-1 truncate text-start text-[13px] font-normal tracking-tight text-muted-foreground"

/** Live label shimmer — ChatGPT-style “thinking” pulse on the status text. */
export const chatThinkingShimmerClass = "chat-thinking-shimmer"

export const chatThinkingIconMutedClass = "size-3.5 shrink-0 opacity-55"
