/** Gemini mobile shell — shared surface styles. */
const chatMobileHeaderButtonClass =
  "size-10 shrink-0 rounded-full border border-black/[0.04] bg-white/95 text-foreground shadow-[0_2px_14px_-5px_rgba(15,23,42,0.14)] transition-[transform,background-color,box-shadow] hover:bg-white active:scale-[0.96] dark:border-white/10 dark:bg-background/90 dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.45)] [&_svg:not([class*='size-'])]:size-[18px]"

const chatMobileHeaderAvatarButtonClass =
  "size-10 shrink-0 overflow-visible rounded-full border border-black/[0.04] bg-white/95 p-[3px] shadow-[0_2px_14px_-5px_rgba(15,23,42,0.14)] transition-[transform,background-color,box-shadow] hover:bg-white active:scale-[0.96] dark:border-white/10 dark:bg-background/90 dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.45)]"

const chatMobileHeaderModelClass =
  "h-10 max-w-[11rem] gap-0.5 rounded-full px-2.5 text-[17px] font-normal tracking-tight text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"

const chatMobileComposerShellClass =
  "relative shrink-0 bg-transparent px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"

const chatMobileComposerPillClass =
  "flex min-h-[4.25rem] items-center gap-1.5 rounded-full border border-black/[0.05] bg-white/98 px-3 shadow-[0_4px_28px_-8px_rgba(15,23,42,0.16)] transition-[box-shadow,transform,border-color] duration-300 focus-within:border-black/[0.07] focus-within:shadow-[0_8px_36px_-10px_rgba(59,130,246,0.22)] dark:border-white/10 dark:bg-background/95 dark:shadow-[0_4px_28px_-10px_rgba(0,0,0,0.55)] dark:focus-within:shadow-[0_8px_36px_-10px_rgba(59,130,246,0.18)]"

const chatMobileComposerIconButtonClass =
  "size-11 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"

const chatMobileComposerSendClass =
  "size-11 rounded-full border-0 bg-[#8ab4f8] text-white shadow-[0_2px_10px_-4px_rgba(59,130,246,0.55)] transition-[transform,background-color,box-shadow] hover:bg-[#7aa7f7] active:scale-[0.96]"

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
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileScrollDownClass,
}
