/** Gemini mobile shell — shared surface styles. */
const chatMobileHeaderButtonClass =
  "size-10 shrink-0 rounded-full text-foreground transition-[transform,background-color] hover:bg-black/[0.04] active:scale-[0.96] dark:hover:bg-white/[0.06] [&_svg:not([class*='size-'])]:size-[22px]"

const chatMobileHeaderModelClass =
  "h-10 max-w-[12rem] gap-0.5 rounded-full px-1 text-[17px] font-normal tracking-tight text-[#1f1f1f] hover:bg-black/[0.04] dark:text-foreground dark:hover:bg-white/[0.06]"

const chatMobileThreadClass = "px-4 py-3 sm:px-5"

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
  chatMobileScrollDownClass,
  chatMobileThreadClass,
  chatMobileUserBubbleClass,
}
