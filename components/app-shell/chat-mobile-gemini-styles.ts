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
  `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium tracking-[-0.015em] text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} transition-[transform,background-color,box-shadow] active:scale-[0.98] hover:bg-white/88 dark:hover:bg-white/[0.12] [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:opacity-65 [&_svg]:text-foreground`

const chatMobileHeaderModelPrimaryClass = "text-foreground"

const chatMobileHeaderModelSecondaryClass = "text-muted-foreground"

const chatMobileEmptyHeroWrapClass =
  "flex min-h-full flex-col items-center justify-center px-5 pb-6 pt-4"

const chatMobileEmptyHeroContentClass =
  "chat-empty-hero flex flex-col items-center gap-5 text-center"

const chatMobileEmptyHeroMarkShellClass =
  "chat-empty-hero-mark relative flex size-[4.5rem] items-center justify-center"

const chatMobileEmptyHeroMarkClass =
  "relative size-full rounded-none bg-transparent shadow-none ring-0"

const chatMobileEmptyHeroTitleClass =
  "chat-empty-hero-title max-w-[20rem] text-balance text-[1.75rem] font-normal leading-[1.22] tracking-[-0.028em] text-foreground"

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

/** Desktop/web composer — iOS liquid glass shell and controls. */
const chatDesktopComposerGlassBorderClass =
  "ring-1 ring-inset ring-white/65 dark:ring-white/12"

const chatDesktopComposerShellClass =
  "relative shrink-0 bg-transparent pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]"

const chatDesktopComposerBodyClass =
  `isolate grid grid-cols-[auto_1fr_auto] overflow-hidden rounded-[22px] px-1.5 pb-1.5 pt-0.5 text-foreground transition-[box-shadow,background-color,ring-color] duration-300 ease-out [grid-template-areas:'primary_primary_primary'_'leading_._trailing'] ${chatMobileComposerGlassClass} ${chatDesktopComposerGlassBorderClass} ${chatMobileComposerGlassFocusClass} focus-within:ring-white/80 dark:focus-within:ring-white/16`

const chatDesktopComposerControlClass =
  "border-0 bg-white/55 ring-1 ring-inset ring-white/55 shadow-[inset_0_0.5px_0_0_color-mix(in_oklch,white_90%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent)] backdrop-blur-xl backdrop-saturate-[190%] transition-[background-color,box-shadow,transform,color,ring-color] hover:bg-white/68 hover:ring-white/70 active:scale-[0.98] dark:bg-white/[0.1] dark:ring-white/10 dark:hover:bg-white/[0.14] dark:hover:ring-white/14"

const chatDesktopComposerIconButtonClass =
  `${chatDesktopComposerControlClass} size-9 rounded-xl text-muted-foreground hover:text-foreground sm:size-8 [&_svg]:stroke-[1.75]`

const chatDesktopComposerEffortButtonClass =
  `${chatDesktopComposerControlClass} h-9 gap-1 rounded-xl px-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground sm:h-8 [&_svg]:opacity-70`

const chatDesktopComposerSendClass =
  "size-10 rounded-full border-0 bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 active:scale-[0.96] sm:size-9"

const chatDesktopComposerSendDisabledClass =
  `${chatDesktopComposerControlClass} size-10 rounded-full text-muted-foreground/70 sm:size-9`

/** Empty-state sample prompt cards — white surface, shadow on hover. */
const chatSamplePromptButtonClass =
  "h-auto w-fit max-w-[18rem] items-stretch justify-start rounded-xl border-0 bg-white px-3 py-2.5 text-left whitespace-normal shadow-none transition-[background-color,box-shadow,transform] hover:bg-white hover:shadow-[0_4px_18px_-6px_color-mix(in_oklch,var(--foreground)_11%,transparent),0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_5%,transparent)] active:scale-[0.99] dark:bg-white/[0.08] dark:hover:bg-white/[0.11] dark:hover:shadow-[0_8px_28px_-10px_color-mix(in_oklch,black_32%,transparent)] sm:max-w-[20rem]"

const chatSamplePromptIconClass =
  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-muted-foreground"

const chatMobileComposerIconButtonClass =
  "size-10 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground [&_svg]:stroke-[1.75]"

/** Active tool chip — dark liquid glass (shared base). */
const chatComposerToolChipClass =
  "shrink-0 border-0 bg-foreground/88 font-medium text-background shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_16%,transparent),0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_28%,transparent)] backdrop-blur-xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-foreground/82 dark:bg-foreground/92 dark:text-background dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_12%,transparent),0_2px_10px_-2px_color-mix(in_oklch,black_35%,transparent)]"

const chatComposerToolChipCloseClass =
  "flex shrink-0 items-center justify-center rounded-full text-background/65 transition-[color,background-color] hover:bg-background/14 hover:text-background active:scale-95"

const chatMobileComposerToolChipClass =
  `${chatComposerToolChipClass} h-7 gap-1.5 rounded-full px-2.5 py-0 text-[13px] tracking-[-0.01em]`

const chatDesktopComposerToolChipClass =
  `${chatComposerToolChipClass} mt-0.5 h-6 gap-1 rounded-lg px-2 py-0 text-[12px]`

const chatMobileComposerToolChipCloseClass =
  `${chatComposerToolChipCloseClass} size-4`

const chatDesktopComposerToolChipCloseClass =
  `${chatComposerToolChipCloseClass} size-3.5`

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

const chatMobileToolsMenuClass =
  `z-30 min-w-[13.5rem] overflow-hidden rounded-2xl p-1.5 text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_12px_40px_-16px_color-mix(in_oklch,var(--foreground)_18%,transparent)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_12px_40px_-16px_color-mix(in_oklch,black_45%,transparent)]`

const chatMobileToolsMenuLabelClass =
  "px-2.5 pb-1 pt-1.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground"

const chatMobileToolsMenuItemClass =
  "flex w-full flex-col items-start gap-0.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.05] data-[highlighted]:bg-foreground/[0.05] data-[selected=true]:bg-foreground/[0.07]"

const chatMobileToolsMenuItemTitleClass =
  "text-[14px] font-medium tracking-[-0.01em] text-foreground"

const chatMobileToolsMenuItemDescClass =
  "text-[12px] leading-snug text-muted-foreground"


export {
  chatMobileAssistantClass,
  chatMobileComposerIconButtonClass,
  chatMobileComposerPillClass,
  chatMobileComposerSendClass,
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
  chatSamplePromptButtonClass,
  chatSamplePromptIconClass,
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
  chatMobileToolsMenuClass,
  chatMobileToolsMenuItemClass,
  chatMobileToolsMenuItemDescClass,
  chatMobileToolsMenuItemTitleClass,
  chatMobileToolsMenuLabelClass,
  chatMobileUserBubbleClass,
}
