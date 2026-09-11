/** Gemini mobile shell — shared surface styles. */
const chatMobileHeaderCircleClass =
  "rounded-full border border-black/[0.06] bg-white/92 text-foreground shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-[transform,background-color] hover:bg-white active:scale-[0.96] dark:border-white/10 dark:bg-background/92 dark:shadow-none"

const chatMobileHeaderButtonClass =
  `size-10 shrink-0 ${chatMobileHeaderCircleClass} [&_svg:not([class*='size-'])]:size-[22px]`

const chatMobileHeaderNewChatClass =
  `relative size-10 shrink-0 ${chatMobileHeaderCircleClass} [&_svg:not([class*='size-'])]:size-[20px] before:pointer-events-none before:absolute before:inset-[7px] before:rounded-full before:border before:border-dashed before:border-black/[0.2] dark:before:border-white/25`

const chatMobileHeaderAvatarButtonClass =
  `flex size-10 shrink-0 items-center justify-center p-0 ${chatMobileHeaderCircleClass}`

const chatMobileHeaderAvatarClass = "size-8 after:border-0 ring-0"

const chatMobileHeaderModelClass =
  "h-10 max-w-[11rem] gap-1 rounded-full px-2 text-[17px] font-normal tracking-tight text-[#1f1f1f] hover:bg-black/[0.04] dark:text-foreground dark:hover:bg-white/[0.06] [&_svg]:size-5 [&_svg]:text-[#444746]"

const chatMobileThreadClass = "px-4 pt-3 pb-2 sm:px-5"

/** Scroll tail room so the last turn clears the bottom fade + composer. */
const chatMobileThreadBottomSpacerClass = "h-40 shrink-0"

/** Soft bottom fade — masks scroll content, no visible overlay band. */
const chatMobileThreadScrollMaskClass =
  "[&_[data-slot=scroll-area-viewport]]:mask-[linear-gradient(to_bottom,black_0%,black_72%,rgba(0,0,0,0.55)_86%,transparent_100%)] [&_[data-slot=scroll-area-viewport]]:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_72%,rgba(0,0,0,0.55)_86%,transparent_100%)]"

const chatMobileUserBubbleClass =
  "max-w-[88%] rounded-[24px] bg-[#f0f4f9] px-4 py-3 text-[15px] leading-[1.55] text-[#1f1f1f] dark:border dark:border-border/50 dark:bg-secondary dark:text-foreground"

const chatMobileAssistantClass =
  "text-[15px] leading-[1.65] text-[#1f1f1f] dark:text-foreground/92 [&_p]:mb-3 [&_p:last-child]:mb-0"

const chatMobileComposerShellClass =
  "relative shrink-0 bg-transparent px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"

const chatMobileComposerPillClass =
  "flex min-h-[3.75rem] items-center gap-1 rounded-full border border-black/[0.06] bg-[#f0f4f9] px-2.5 shadow-none transition-[box-shadow,transform,border-color,background-color] duration-300 focus-within:border-black/[0.08] focus-within:bg-[#e8eef6] dark:border-white/10 dark:bg-muted/40 dark:focus-within:bg-muted/55"

const chatMobileComposerIconButtonClass =
  "size-10 shrink-0 rounded-full text-[#444746] transition-colors hover:bg-black/[0.05] hover:text-foreground dark:text-muted-foreground dark:hover:bg-white/[0.06]"

const chatMobileComposerSendClass =
  "size-10 rounded-full border-0 bg-[#0b57d0] text-white shadow-none transition-[transform,background-color] hover:bg-[#0842a0] active:scale-[0.96] dark:bg-[#8ab4f8] dark:hover:bg-[#7aa7f7]"

const chatMobileScrollDownClass =
  "absolute bottom-3 left-1/2 z-10 size-9 -translate-x-1/2 rounded-full border border-black/[0.05] bg-white/95 text-foreground shadow-[0_4px_20px_-8px_rgba(15,23,42,0.18)] backdrop-blur-sm hover:bg-white dark:border-white/10 dark:bg-background/90"

const chatMobileDrawerSurfaceClass =
  "bg-[#f6f8fb] text-foreground dark:bg-background"

const chatMobileDrawerNavItemClass =
  "h-11 w-full justify-start gap-4 rounded-xl px-3 text-[15px] font-normal text-foreground shadow-none hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"

const chatMobileDrawerSectionLabelClass =
  "px-3 pb-2 pt-5 text-[13px] font-normal text-muted-foreground first:pt-2"

const chatMobileDrawerUpgradeClass =
  "h-9 shrink-0 rounded-full border-0 bg-[#8ab4f8] px-5 text-[14px] font-medium text-white shadow-none hover:bg-[#7aa7f7]"

const chatMobileDrawerFooterWrapClass = "relative z-10 -mt-14 shrink-0"

const chatMobileDrawerFooterFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-full h-14 bg-linear-to-b from-transparent from-0% via-[#f6f8fb]/20 via-40% to-[#f6f8fb] to-100% dark:via-background/20 dark:to-background"

const chatMobileDrawerFooterBarClass =
  "relative bg-[#f6f8fb]/92 pt-3 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.1)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#f6f8fb]/78 dark:bg-background/92 dark:supports-[backdrop-filter]:bg-background/78"

/** Shared mobile bottom sheets — guide, privacy, checkout. */
const chatMobileSheetContentClass =
  "max-h-[min(92dvh,720px)] gap-0 overflow-y-auto rounded-t-[1.75rem] border-0 bg-[#f6f8fb] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 text-foreground shadow-[0_-12px_48px_-16px_rgba(15,23,42,0.14)] dark:bg-background dark:shadow-[0_-12px_48px_-16px_rgba(0,0,0,0.45)]"

const chatMobileSheetHandleClass =
  "mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-black/[0.12] dark:bg-white/20"

const chatMobileSheetHeaderClass =
  "gap-1.5 space-y-0 px-5 pb-2 pt-0 text-left"

const chatMobileSheetTitleClass =
  "text-[22px] font-normal tracking-tight text-[#1f1f1f] dark:text-foreground"

const chatMobileSheetDescriptionClass =
  "text-pretty text-[15px] leading-relaxed text-muted-foreground"

const chatMobileSheetBodyClass = "space-y-4 px-5 pb-2"

const chatMobileSheetSectionLabelClass =
  "text-[13px] font-normal tracking-wide text-muted-foreground uppercase"

const chatMobileSheetCardClass =
  "rounded-2xl border border-black/[0.06] bg-white/75 px-3.5 py-3 dark:border-border/50 dark:bg-muted/20"

const chatMobileSheetFooterClass =
  "sticky bottom-0 border-0 px-5 pt-4 pb-0"

const chatMobileSheetFooterBarClass =
  "rounded-t-[1.25rem] border-t border-black/[0.06] bg-[#f6f8fb]/92 px-0 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.1)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#f6f8fb]/78 dark:border-border/50 dark:bg-background/92 dark:supports-[backdrop-filter]:bg-background/78"

const chatMobileSheetPrimaryButtonClass =
  "h-12 w-full rounded-full text-[15px] font-medium shadow-none"

const chatMobileSheetGhostButtonClass =
  "h-10 w-full rounded-full text-[15px] font-normal text-muted-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"

const chatMobileSheetConsentCheckedClass =
  "border-black/[0.08] bg-white/90 shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset] dark:border-border/60 dark:bg-muted/40 dark:shadow-none"

const chatMobileSheetConsentUncheckedClass =
  "border-black/[0.06] bg-white/60 hover:border-black/[0.1] hover:bg-white/80 dark:border-border/45 dark:bg-muted/15 dark:hover:bg-muted/25"

export {
  chatMobileAssistantClass,
  chatMobileComposerIconButtonClass,
  chatMobileComposerPillClass,
  chatMobileComposerSendClass,
  chatMobileComposerShellClass,
  chatMobileDrawerFooterBarClass,
  chatMobileDrawerFooterFadeClass,
  chatMobileDrawerFooterWrapClass,
  chatMobileDrawerNavItemClass,
  chatMobileDrawerSectionLabelClass,
  chatMobileDrawerSurfaceClass,
  chatMobileDrawerUpgradeClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderNewChatClass,
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderAvatarClass,
  chatMobileScrollDownClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetConsentCheckedClass,
  chatMobileSheetConsentUncheckedClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetGhostButtonClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSectionLabelClass,
  chatMobileSheetTitleClass,
  chatMobileThreadClass,
  chatMobileThreadBottomSpacerClass,
  chatMobileThreadScrollMaskClass,
  chatMobileUserBubbleClass,
}
