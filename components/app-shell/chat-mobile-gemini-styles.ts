/** iOS-style liquid glass — edge from highlight + shadow, no border. */
const chatMobileGlassSurfaceClass =
  "border-0 bg-white/78 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_8px_24px_-10px_color-mix(in_oklch,var(--foreground)_9%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_8px_28px_-12px_color-mix(in_oklch,black_35%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

/** Composer — floating iOS bar with softer lift and no hard edge. */
const chatMobileComposerGlassClass =
  "border-0 bg-white/80 shadow-[inset_0_0.5px_0_0_color-mix(in_oklch,white_90%,transparent),inset_0_1px_0_0_color-mix(in_oklch,white_70%,transparent),0_2px_6px_-2px_color-mix(in_oklch,var(--foreground)_6%,transparent),0_12px_40px_-14px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-[32px] backdrop-saturate-[190%] supports-[backdrop-filter]:bg-white/68 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_10px_36px_-14px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

const chatMobileComposerGlassFocusClass =
  "focus-within:bg-white/90 focus-within:shadow-[inset_0_0.5px_0_0_color-mix(in_oklch,white_95%,transparent),inset_0_1px_0_0_color-mix(in_oklch,white_80%,transparent),0_4px_10px_-3px_color-mix(in_oklch,var(--foreground)_7%,transparent),0_16px_44px_-12px_color-mix(in_oklch,var(--foreground)_12%,transparent)] dark:focus-within:bg-white/[0.14]"

const chatMobilePrimaryButtonClass =
  "border-0 bg-primary text-primary-foreground shadow-none hover:bg-primary/90"

const chatMobileHeaderShadowClass =
  "shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--background)_55%,white),0_1px_3px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_6px_18px_-8px_color-mix(in_oklch,var(--foreground)_6%,transparent)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_8%,transparent),0_1px_3px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_6px_18px_-8px_color-mix(in_oklch,var(--foreground)_10%,transparent)]"

const chatMobileHeaderShadowHoverClass =
  "hover:bg-white/88 hover:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_80%,transparent),0_2px_8px_-3px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_7%,transparent)] dark:hover:bg-white/[0.12]"

const chatMobileHeaderCircleClass =
  `rounded-full ${chatMobileGlassSurfaceClass} text-foreground transition-[transform,background-color,box-shadow] active:scale-[0.96]`

const chatMobileHeaderButtonClass =
  `size-10 shrink-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} [&_svg:not([class*='size-'])]:size-[22px] [&_svg]:stroke-[1.75]`

const chatMobileHeaderNewChatClass =
  `size-10 shrink-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} text-foreground [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75]`

const chatMobileHeaderAvatarButtonClass =
  `flex size-10 shrink-0 items-center justify-center overflow-visible p-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass}`

const chatMobileHeaderAvatarClass = "size-8 after:border-0 ring-0"

const chatMobileHeaderPlanBadgeClass =
  "h-3.5 translate-y-[48%] px-1.5 text-[8px] font-semibold shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"

const chatMobileHeaderModelClass =
  "h-10 max-w-[12rem] gap-0.5 rounded-full px-2.5 text-[17px] font-normal tracking-[-0.01em] text-foreground hover:bg-accent [&_svg]:size-[18px] [&_svg]:text-muted-foreground"

const chatMobileHeaderModelPrimaryClass = "text-foreground"

const chatMobileHeaderModelSecondaryClass = "text-muted-foreground"

const chatMobileEmptyHeroWrapClass =
  "flex min-h-full flex-col items-center justify-center px-5 pb-6 pt-4"

const chatMobileEmptyHeroContentClass =
  "chat-empty-hero flex flex-col items-center gap-5 text-center"

const chatMobileEmptyHeroMarkShellClass =
  "chat-empty-hero-mark relative flex size-[6.5rem] items-center justify-center"

const chatMobileEmptyHeroMarkClass =
  "relative z-[1] size-[4.5rem] rounded-none bg-transparent shadow-none ring-0"

const chatMobileEmptyHeroTitleClass =
  "chat-empty-hero-title max-w-[20rem] text-balance text-[1.75rem] font-medium leading-[1.22] tracking-[-0.028em] text-foreground"

const chatMobileThreadClass = "px-4 pt-3 pb-2 sm:px-5"

/** Scroll tail room so the last turn clears the bottom fade + composer. */
const chatMobileThreadBottomSpacerClass = "h-40 shrink-0"

/** Soft bottom fade — masks scroll content opacity. */
const chatMobileThreadScrollMaskClass =
  "[&_[data-slot=scroll-area-viewport]]:mask-[linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.88)_68%,rgba(0,0,0,0.45)_82%,transparent_100%)] [&_[data-slot=scroll-area-viewport]]:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.88)_68%,rgba(0,0,0,0.45)_82%,transparent_100%)]"

/** Bottom blur + fade overlay — masked so the top edge stays invisible. */
const chatMobileThreadBottomFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-36 bg-gradient-to-t from-background from-0% via-background/55 via-40% to-transparent to-100% backdrop-blur-md backdrop-saturate-150 [mask-image:linear-gradient(to_top,black_0%,black_38%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_38%,transparent_100%)] supports-[backdrop-filter]:from-background/92 supports-[backdrop-filter]:via-background/30 supports-[backdrop-filter]:to-transparent"

const chatMobileUserBubbleClass =
  "max-w-[88%] rounded-[24px] border border-transparent bg-secondary px-4 py-3 text-[15px] leading-[1.55] text-secondary-foreground dark:border-border/50"

const chatMobileAssistantClass =
  "text-[15px] leading-[1.65] text-foreground [&_p]:mb-3 [&_p:last-child]:mb-0"

const chatMobileComposerShellClass =
  "relative shrink-0 bg-transparent px-4 pt-1.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"

const chatMobileComposerPillClass =
  `flex min-h-16 items-end gap-0.5 rounded-[26px] px-2.5 py-2.5 text-foreground transition-[box-shadow,background-color] duration-300 ease-out ${chatMobileComposerGlassClass} ${chatMobileComposerGlassFocusClass}`

const chatMobileComposerIconButtonClass =
  "size-10 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground [&_svg]:stroke-[1.75]"

const chatMobileComposerSendClass =
  "size-10 rounded-full border-0 bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 active:scale-[0.96] active:shadow-[0_1px_4px_-1px_color-mix(in_oklch,var(--foreground)_14%,transparent)]"

const chatMobileScrollDownClass =
  "absolute bottom-3 left-1/2 z-10 size-9 -translate-x-1/2 rounded-full border-0 bg-white/78 text-foreground backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_2px_10px_-3px_color-mix(in_oklch,var(--foreground)_7%,transparent),0_8px_24px_-10px_color-mix(in_oklch,var(--foreground)_8%,transparent)] hover:bg-white/88 dark:bg-white/[0.08] dark:supports-[backdrop-filter]:bg-white/[0.06] dark:hover:bg-white/[0.12]"

const chatMobileDrawerSurfaceClass = "bg-background text-foreground"

const chatMobileDrawerNavItemClass =
  "h-11 w-full justify-start gap-4 rounded-xl px-3 text-[15px] font-normal text-foreground shadow-none hover:bg-accent"

const chatMobileDrawerSectionLabelClass =
  "px-3 pb-2 pt-5 text-[13px] font-normal text-muted-foreground first:pt-2"

const chatMobileDrawerUpgradeClass =
  `h-9 shrink-0 rounded-full px-5 text-[14px] font-medium ${chatMobilePrimaryButtonClass}`

const chatMobileDrawerFooterWrapClass = "relative z-10 -mt-14 shrink-0"

const chatMobileDrawerFooterFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-full h-14 bg-linear-to-b from-transparent from-0% via-background/20 via-40% to-background to-100%"

const chatMobileDrawerFooterBarClass =
  "relative bg-background/92 pt-3 shadow-[0_-8px_24px_-16px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/78"

/** Shared mobile bottom sheets — guide, privacy, checkout. */
const chatMobileSheetContentClass =
  "max-h-[min(92dvh,720px)] gap-0 overflow-y-auto rounded-t-[1.75rem] border-0 bg-background pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 text-foreground shadow-[0_-12px_48px_-16px_color-mix(in_oklch,var(--foreground)_12%,transparent)]"

const chatMobileSheetHandleClass =
  "mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border"

const chatMobileSheetHeaderClass =
  "gap-1.5 space-y-0 px-5 pb-2 pt-0 text-left"

const chatMobileSheetTitleClass =
  "text-[22px] font-normal tracking-tight text-foreground"

const chatMobileSheetDescriptionClass =
  "text-pretty text-[15px] leading-relaxed text-muted-foreground"

const chatMobileSheetBodyClass = "space-y-4 px-5 pb-2"

const chatMobileSheetSectionLabelClass =
  "text-[13px] font-normal tracking-wide text-muted-foreground uppercase"

const chatMobileSheetCardClass =
  "rounded-2xl border border-border/60 bg-card/75 px-3.5 py-3"

const chatMobileSheetFooterClass =
  "sticky bottom-0 border-0 px-5 pt-4 pb-0"

const chatMobileSheetFooterBarClass =
  "rounded-t-[1.25rem] border-t border-border/60 bg-background/92 px-0 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_-16px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/78"

const chatMobileSheetPrimaryButtonClass =
  `h-12 w-full rounded-full text-[15px] font-medium ${chatMobilePrimaryButtonClass}`

const chatMobileSheetGhostButtonClass =
  "h-10 w-full rounded-full text-[15px] font-normal text-muted-foreground hover:bg-accent hover:text-foreground"

const chatMobileSheetConsentCheckedClass =
  "border-border/60 bg-card shadow-[0_1px_0_0_color-mix(in_oklch,var(--background)_80%,transparent)_inset]"

const chatMobileSheetConsentUncheckedClass =
  "border-border/50 bg-card/60 hover:border-border hover:bg-card/80"

export {
  chatMobileAssistantClass,
  chatMobileComposerIconButtonClass,
  chatMobileComposerPillClass,
  chatMobileComposerSendClass,
  chatMobileComposerShellClass,
  chatMobileEmptyHeroContentClass,
  chatMobileEmptyHeroMarkClass,
  chatMobileEmptyHeroMarkShellClass,
  chatMobileEmptyHeroTitleClass,
  chatMobileEmptyHeroWrapClass,
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
  chatMobileHeaderPlanBadgeClass,
  chatMobileHeaderModelPrimaryClass,
  chatMobileHeaderModelSecondaryClass,
  chatMobilePrimaryButtonClass,
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
  chatMobileThreadBottomFadeClass,
  chatMobileThreadScrollMaskClass,
  chatMobileUserBubbleClass,
}
