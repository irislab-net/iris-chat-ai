/** iOS-style liquid glass — edge from highlight + shadow, no border. */
const chatMobileGlassSurfaceClass =
  "border-0 bg-white/78 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_8px_24px_-10px_color-mix(in_oklch,var(--foreground)_9%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_8px_28px_-12px_color-mix(in_oklch,black_35%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

/**
 * Composer — iOS 26 liquid glass: translucent fill + inner specular/rim only.
 * No outer drop shadow (especially no bottom lift shadow).
 */
const chatMobileComposerGlassClass =
  "border-0 bg-white/58 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_95%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,white_55%,transparent),inset_0_-1px_1px_0_color-mix(in_oklch,white_28%,transparent),inset_0_2px_10px_0_color-mix(in_oklch,var(--foreground)_4%,transparent),inset_0_-3px_12px_0_color-mix(in_oklch,var(--foreground)_3.5%,transparent)] backdrop-blur-[40px] backdrop-saturate-[200%] supports-[backdrop-filter]:bg-white/42 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_18%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,var(--foreground)_12%,transparent),inset_0_-1px_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent),inset_0_2px_12px_0_color-mix(in_oklch,black_22%,transparent),inset_0_-3px_14px_0_color-mix(in_oklch,black_18%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

const chatMobileComposerGlassFocusClass =
  "focus-within:bg-white/68 focus-within:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_98%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,white_65%,transparent),inset_0_-1px_1px_0_color-mix(in_oklch,white_32%,transparent),inset_0_2px_12px_0_color-mix(in_oklch,var(--foreground)_5%,transparent),inset_0_-3px_14px_0_color-mix(in_oklch,var(--foreground)_4%,transparent)] dark:focus-within:bg-white/[0.14] dark:focus-within:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_22%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,var(--foreground)_14%,transparent),inset_0_-1px_1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent),inset_0_2px_14px_0_color-mix(in_oklch,black_26%,transparent),inset_0_-3px_16px_0_color-mix(in_oklch,black_20%,transparent)]"

const chatMobilePrimaryButtonClass =
  "border-0 bg-primary text-primary-foreground shadow-none hover:bg-primary/90"

const chatMobileHeaderShadowClass =
  "shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--background)_55%,white),0_1px_3px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_6px_18px_-8px_color-mix(in_oklch,var(--foreground)_6%,transparent)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_8%,transparent),0_1px_3px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_6px_18px_-8px_color-mix(in_oklch,var(--foreground)_10%,transparent)]"

const chatMobileHeaderShadowHoverClass =
  "hover:bg-white/88 hover:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_80%,transparent),0_2px_8px_-3px_color-mix(in_oklch,var(--foreground)_5%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_7%,transparent)] dark:hover:bg-white/[0.12]"

const chatMobileHeaderCircleClass =
  `rounded-full ${chatMobileGlassSurfaceClass} text-foreground transition-[transform,background-color,box-shadow] active:scale-[0.96]`

const chatMobileHeaderButtonClass =
  `size-10 shrink-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} [&_svg:not([class*='size-'])]:size-5.5 [&_svg]:stroke-[1.75]`

const chatMobileHeaderNewChatClass = chatMobileHeaderButtonClass

const chatMobileHeaderAvatarButtonClass =
  `flex size-10 shrink-0 items-center justify-center overflow-visible p-0 ${chatMobileHeaderCircleClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass}`

const chatMobileHeaderAvatarClass = "size-8 after:border-0 ring-0"

const chatMobileHeaderPlanBadgeClass =
  "h-3.5 translate-y-[48%] px-1.5 text-[8px] font-semibold shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"

const chatMobileHeaderModelClass =
  `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium tracking-[-0.015em] text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} transition-[transform,background-color,box-shadow] active:scale-[0.98] hover:bg-white/88 dark:hover:bg-white/[0.12] [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:opacity-65 [&_svg]:text-foreground`

const chatMobileHeaderModelPrimaryClass = "text-foreground"

const chatMobileHeaderModelSecondaryClass = "text-muted-foreground"

/** Empty hero — vertical padding clears absolute header + composer chrome. */
const chatMobileEmptyHeroWrapClass =
  "flex min-h-full flex-col items-center justify-center px-6 pt-[max(5.5rem,calc(var(--app-safe-top)+4.25rem))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"

const chatMobileEmptyHeroContentClass =
  "chat-empty-hero flex flex-col items-center gap-5 text-center"

const chatMobileEmptyHeroMarkClass =
  "chat-empty-hero-mark relative size-12 shrink-0 rounded-full"

const chatMobileEmptyHeroTitleClass =
  "chat-empty-hero-title max-w-[20rem] text-balance text-[1.75rem] font-light leading-[1.22] tracking-[-0.028em] text-foreground"

const chatMobileThreadClass = "px-6 pt-5 pb-2"

/**
 * Top clearance spacer — matches absolute header height (safe-area + 40px
 * controls) so the first turn clears the overlay fade.
 */
const chatMobileThreadTopSpacerClass =
  "app-mobile-safe-header pointer-events-none h-10 shrink-0 pb-8"

/** Extra breathing room below the header fade for the first turn. */
const chatMobileThreadFirstTurnClass = "mt-2 sm:mt-3"

/** Scroll tail room so the last turn clears the floating composer. */
const chatMobileThreadBottomSpacerClass =
  "h-[calc(5.75rem+env(safe-area-inset-bottom,0px))] shrink-0"

/** Soft scroll fades — content dissolves under absolute header + composer. */
const chatMobileThreadScrollMaskClass =
  "[&_[data-slot=scroll-area-viewport]]:mask-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_3%,rgba(0,0,0,0.85)_7%,black_12%,black_78%,rgba(0,0,0,0.8)_88%,rgba(0,0,0,0.4)_95%,transparent_100%)] [&_[data-slot=scroll-area-viewport]]:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_3%,rgba(0,0,0,0.85)_7%,black_12%,black_78%,rgba(0,0,0,0.8)_88%,rgba(0,0,0,0.4)_95%,transparent_100%)]"

/** Bottom blur + fade overlay — strip behind floating composer. */
const chatMobileThreadBottomFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-background/80 from-0% via-background/35 via-40% to-transparent to-100% backdrop-blur-[6px] backdrop-saturate-150 [mask-image:linear-gradient(to_top,black_0%,black_28%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,black_28%,transparent_100%)] supports-[backdrop-filter]:from-background/55 supports-[backdrop-filter]:via-background/15 supports-[backdrop-filter]:to-transparent"

/**
 * Header overlay shell — floats over the thread (Gemini absolute chrome).
 * Scrim is sized to the header box and extends below for the fade.
 */
const chatMobileHeaderShellClass = "absolute inset-x-0 top-0 z-20"

/**
 * Soft header fade — mostly transparent so thread text ghosts under the
 * glass controls (Gemini), solid only near the very top edge.
 */
const chatMobileHeaderScrimClass =
  "pointer-events-none absolute inset-x-0 top-0 -bottom-20 z-0 bg-gradient-to-b from-background/70 from-0% via-background/25 via-35% to-transparent to-100% backdrop-blur-md backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,black_0%,black_30%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_30%,transparent_100%)] supports-[backdrop-filter]:from-background/45 supports-[backdrop-filter]:via-background/12 supports-[backdrop-filter]:to-transparent dark:from-background/75 dark:via-background/30 dark:supports-[backdrop-filter]:from-background/55 dark:supports-[backdrop-filter]:via-background/18"

/** Floating composer dock — absolute over the thread bottom. */
const chatMobileComposerDockClass =
  "absolute inset-x-0 bottom-0 z-20 mx-auto w-full bg-transparent"

const chatMobileUserBubbleClass =
  "w-full rounded-[24px] border border-transparent bg-secondary px-4 py-3 text-[15px] leading-[1.55] text-secondary-foreground dark:border-border/50"

const chatMobileUserBubbleInteractiveClass =
  `${chatMobileUserBubbleClass} outline-none transition-[background-color] duration-150 hover:bg-secondary/90 focus-within:bg-secondary/90 dark:hover:bg-secondary/75 dark:focus-within:bg-secondary/75`

const chatMobileAssistantClass =
  "text-[15px] leading-[1.65] text-foreground [&_p]:mb-3 [&_p:last-child]:mb-0"

const chatMobileComposerShellClass =
  "relative shrink-0 bg-transparent px-6 pt-1.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"

const chatMobileComposerPillClass =
  `grid rounded-[26px] text-foreground transition-[box-shadow,background-color] duration-200 ease-out ${chatMobileComposerGlassClass} ${chatMobileComposerGlassFocusClass}`

/** Compact single-line shell — + and input on one row (Gemini simplified-input-area). */
const chatMobileComposerPillCompactClass =
  "min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-3 [grid-template-areas:'leading_field_trailing']"

/** Grows with content once text wraps past one line. */
const chatMobileComposerPillExpandedClass =
  "min-h-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-end gap-x-0.5 gap-y-0.5 px-2.5 py-2.5 [grid-template-areas:'field_field_field'_'leading_._trailing']"

const chatMobileComposerLeadingClass =
  "[grid-area:leading] flex min-w-0 items-center gap-1"

const chatMobileComposerTrailingClass =
  "[grid-area:trailing] flex shrink-0 items-center justify-end"

const chatMobileComposerTextareaClass =
  "chat-bidi w-full min-w-0 flex-1 field-sizing-content resize-none rounded-none border-0 bg-transparent px-2.5 text-base leading-6 break-words text-foreground shadow-none placeholder:text-muted-foreground/35 focus-visible:border-transparent focus-visible:ring-0 disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-100 dark:bg-transparent dark:disabled:bg-transparent dark:placeholder:text-muted-foreground/30"

const chatMobileComposerTextareaCompactClass =
  "min-h-8 max-h-8 w-full py-1 overflow-hidden leading-8 [field-sizing:fixed]"

const chatMobileComposerTextareaExpandedClass =
  "min-h-10 max-h-40 py-2.5 overflow-y-auto"

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
  `${chatDesktopComposerControlClass} h-9 gap-1 rounded-xl px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:h-8 [&_svg]:opacity-70`

const chatDesktopComposerSendClass =
  "size-10 rounded-full border-0 bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 active:scale-[0.96] sm:size-9"

const chatDesktopComposerSendDisabledClass =
  `${chatDesktopComposerControlClass} size-10 rounded-full text-muted-foreground/70 sm:size-9`

/** Empty-state sample prompt cards — liquid glass, Apple-like inset padding. */
const chatSamplePromptButtonClass =
  `flex h-full w-full min-w-0 items-start justify-start rounded-[20px] border-0 px-4.5 py-4 text-start transition-[background-color,box-shadow,transform] active:scale-[0.985] sm:rounded-[22px] sm:px-5 sm:py-4.5 lg:rounded-[16px] lg:px-3.5 lg:py-3 ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass}`

const chatSamplePromptIconClass =
  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-white/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_82%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent)] backdrop-blur-md backdrop-saturate-150 text-muted-foreground dark:bg-white/[0.1] sm:size-9 sm:rounded-[15px] lg:size-7 lg:rounded-[12px]"

const chatSamplePromptTextClass =
  "flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start lg:gap-0.5"

const chatSamplePromptTitleClass =
  "w-full text-[13px] font-medium leading-snug text-foreground sm:text-sm lg:text-[13px]"

const chatSamplePromptDescriptionClass =
  "w-full line-clamp-2 text-pretty text-[11px] leading-5 break-words text-muted-foreground sm:text-xs sm:leading-5 lg:text-[11px] lg:leading-4"

const chatEmptyHeroPromptsClass =
  "chat-empty-hero-prompts mt-1 flex w-full min-w-0 self-stretch flex-col items-center gap-2"

const chatSamplePromptCarouselClass =
  "w-full min-w-0 touch-pan-y lg:hidden [&_[data-slot=carousel-content]]:overflow-x-clip [&_[data-slot=carousel-content]]:px-1.5 [&_[data-slot=carousel-content]]:py-2.5 [&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] [&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] rtl:[&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_left,transparent_0%,black_10%,black_90%,transparent_100%)] rtl:[&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_left,transparent_0%,black_10%,black_90%,transparent_100%)]"

const chatSamplePromptCarouselContentClass = "-ms-5 w-full items-stretch"

const chatSamplePromptCarouselItemClass =
  "flex min-w-0 basis-[88%] shrink-0 grow-0 self-stretch ps-5 sm:basis-[86%]"

const chatSamplePromptCarouselDotsClass = "mt-2.5"

const chatSamplePromptStaticListClass =
  "mx-auto hidden w-full max-w-md grid-cols-1 gap-2 lg:grid"

const chatMobileComposerIconButtonClass =
  "size-10 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground [&_svg]:stroke-[1.75]"

const chatMobileComposerIconButtonCompactClass =
  "size-10 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground [&_svg]:stroke-[1.75]"

/** Active tool chip — dark liquid glass (shared base). */
const chatComposerToolChipClass =
  "shrink-0 border-0 bg-foreground/88 font-medium text-background shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_16%,transparent),0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_28%,transparent)] backdrop-blur-xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-foreground/82 dark:bg-foreground/92 dark:text-background dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_12%,transparent),0_2px_10px_-2px_color-mix(in_oklch,black_35%,transparent)]"

const chatComposerToolChipCloseClass =
  "flex shrink-0 items-center justify-center rounded-full text-background/65 transition-[color,background-color] hover:bg-background/14 hover:text-background active:scale-95"

const chatMobileComposerToolChipClass =
  `${chatComposerToolChipClass} h-7 gap-1.5 rounded-full px-2.5 py-0 text-[13px] tracking-[-0.01em]`

const chatDesktopComposerToolChipClass =
  `${chatComposerToolChipClass} mt-0.5 h-6 gap-1 rounded-lg px-2 py-0 text-xs`

const chatMobileComposerToolChipCloseClass =
  `${chatComposerToolChipCloseClass} size-4`

const chatDesktopComposerToolChipCloseClass =
  `${chatComposerToolChipCloseClass} size-3.5`

const chatMobileComposerSendClass =
  "size-10 rounded-full border-0 bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklch,var(--foreground)_18%,transparent)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 active:scale-[0.96] active:shadow-[0_1px_4px_-1px_color-mix(in_oklch,var(--foreground)_14%,transparent)]"

const chatMobileScrollDownClass =
  "absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-10 size-9 -translate-x-1/2 rounded-full border-0 bg-white/78 text-foreground backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/62 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_2px_10px_-3px_color-mix(in_oklch,var(--foreground)_7%,transparent),0_8px_24px_-10px_color-mix(in_oklch,var(--foreground)_8%,transparent)] hover:bg-white/88 dark:bg-white/[0.08] dark:supports-[backdrop-filter]:bg-white/[0.06] dark:hover:bg-white/[0.12]"

const chatMobileDrawerSurfaceClass = "bg-background text-foreground"

const chatMobileDrawerNavItemClass =
  "h-11 w-full justify-start gap-4 rounded-xl px-3 text-[15px] font-normal text-foreground shadow-none hover:bg-accent"

const chatMobileDrawerSectionLabelClass =
  "px-3 pb-2 pt-5 text-[13px] font-normal text-muted-foreground first:pt-2"

const chatMobileDrawerUpgradeClass =
  `h-9 shrink-0 rounded-full px-5 text-sm font-medium ${chatMobilePrimaryButtonClass}`

const chatMobileDrawerFooterWrapClass = "relative z-10 shrink-0"

/** Short fade above drawer footer — blur only at the edge, no shadow band. */
const chatMobileDrawerFooterFadeClass =
  "pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-b from-transparent to-background backdrop-blur-[2px] backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,transparent_0%,black_85%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_85%)] supports-[backdrop-filter]:to-background/95"

const chatMobileDrawerFooterBarClass =
  "relative bg-background/88 py-2 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/72"

/** Shared mobile bottom sheets — guide, privacy, checkout. */
const chatMobileSheetContentClass =
  "max-h-[min(92dvh,720px)] gap-0 overflow-y-auto rounded-t-[1.75rem] border-0 bg-white/82 pb-0 pt-2 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_-16px_48px_-18px_color-mix(in_oklch,var(--foreground)_14%,transparent)] backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-white/68 dark:bg-white/[0.1] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_-16px_48px_-18px_color-mix(in_oklch,black_45%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.07]"

const chatMobileSheetHandleClass =
  "mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-foreground/15 dark:bg-white/20"

const chatMobileSheetHeaderClass =
  "gap-1.5 space-y-0 px-5 pb-2 pt-0 text-start"

const chatMobileSheetTitleClass =
  "text-[22px] font-normal tracking-tight text-foreground"

const chatMobileSheetDescriptionClass =
  "text-pretty text-[15px] leading-relaxed text-muted-foreground"

const chatMobileSheetBodyClass = "space-y-4 px-5 pb-2"

const chatMobileSheetSectionLabelClass =
  "text-[13px] font-normal tracking-wide text-muted-foreground uppercase"

const chatMobileSheetCardClass =
  `rounded-2xl border-0 px-3.5 py-3 ${chatMobileGlassSurfaceClass}`

const chatMobileSheetFooterClass =
  "mt-auto gap-0 border-0 !p-0"

const chatMobileSheetFooterBarClass =
  "w-full border-0 bg-transparent px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"

const chatMobileSheetPrimaryButtonClass =
  "h-12 w-full rounded-full text-[15px] font-medium"

const chatMobileSheetGhostButtonClass =
  "h-11 w-full rounded-full text-[15px] font-medium"

const chatMobileSheetConsentCheckedClass =
  `border-0 ${chatMobileGlassSurfaceClass}`

const chatMobileSheetConsentUncheckedClass =
  `border-0 bg-white/45 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_70%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/32 hover:bg-white/55 dark:bg-white/[0.06] dark:supports-[backdrop-filter]:bg-white/[0.05] dark:hover:bg-white/[0.09]`

/** Desktop login / consent dialog — same liquid glass language. */
const chatLoginConsentDialogClass =
  `gap-0 overflow-hidden !rounded-[1.5rem] !border-0 !bg-white/78 p-0 !text-foreground !shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_24px_64px_-24px_color-mix(in_oklch,var(--foreground)_22%,transparent)] !ring-0 backdrop-blur-2xl backdrop-saturate-[180%] supports-[backdrop-filter]:!bg-white/62 sm:max-w-[24rem] dark:!bg-white/[0.08] dark:!shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_24px_64px_-24px_color-mix(in_oklch,black_50%,transparent)] dark:supports-[backdrop-filter]:!bg-white/[0.06]`

const chatLoginConsentBrandMarkClass =
  `flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass}`


const chatMobileToolsMenuClass =
  `z-30 min-w-[13.5rem] overflow-hidden rounded-2xl p-1.5 text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent),0_12px_40px_-16px_color-mix(in_oklch,var(--foreground)_18%,transparent)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_12px_40px_-16px_color-mix(in_oklch,black_45%,transparent)]`

const chatMobileToolsMenuLabelClass =
  "px-2.5 pb-1 pt-1.5 text-[11px] font-medium tracking-[0.04em] text-muted-foreground"

const chatMobileToolsMenuItemClass =
  "flex w-full flex-col items-start gap-0.5 rounded-xl px-2.5 py-2.5 text-start transition-colors hover:bg-foreground/[0.05] data-[highlighted]:bg-foreground/[0.05] data-[selected=true]:bg-foreground/[0.07]"

const chatMobileToolsMenuItemTitleClass =
  "text-sm font-medium tracking-[-0.01em] text-foreground"

const chatMobileToolsMenuItemDescClass =
  "text-xs leading-snug text-muted-foreground"

/** Trade signal card — liquid glass, no border. */
const chatSignalCardClass =
  `overflow-hidden rounded-[1.25rem] border-0 text-foreground ${chatMobileGlassSurfaceClass} shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_72%,transparent),0_14px_44px_-20px_color-mix(in_oklch,var(--foreground)_14%,transparent)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_16px_48px_-22px_color-mix(in_oklch,black_48%,transparent)]`

const chatSignalCardInsetClass =
  "rounded-2xl border-0 bg-white/45 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_82%,transparent)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/32 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.05]"

const chatSignalCardChipClass =
  "inline-flex items-center gap-1 rounded-full border-0 bg-white/55 px-2.5 py-1 text-[11px] font-medium tracking-[0.03em] text-muted-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_80%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-white/40 dark:bg-white/[0.1] dark:supports-[backdrop-filter]:bg-white/[0.08]"

const chatSignalCardIconShellClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full border-0 bg-white/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_75%,transparent)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/35 dark:bg-white/[0.09] dark:supports-[backdrop-filter]:bg-white/[0.07]"

const chatSignalCardEntryShellClass =
  "rounded-xl border-0 bg-white/62 px-3 py-2.5 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_88%,transparent),0_4px_16px_-12px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-white/48 dark:bg-white/[0.11] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_12%,transparent),0_4px_16px_-12px_color-mix(in_oklch,black_30%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.08]"

const chatSignalCardMetricTileClass =
  "rounded-xl border-0 bg-white/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_78%,transparent),0_3px_14px_-10px_color-mix(in_oklch,var(--foreground)_9%,transparent)] backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-white/36 dark:bg-white/[0.08] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent),0_4px_16px_-12px_color-mix(in_oklch,black_32%,transparent)] dark:supports-[backdrop-filter]:bg-white/[0.06]"

/** Desktop news panel — distinct sidebar surface; glass stays on cards/controls. */
const chatNewsPanelShellClass = "border-0 bg-sidebar text-sidebar-foreground"

/** Mobile news sheet — same solid fill as the main app / history drawer. */
const chatNewsPanelShellMobileClass = `border-0 ${chatMobileDrawerSurfaceClass}`

const chatNewsPanelHeaderClass =
  "app-mobile-safe-header flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-1"

const chatNewsFreshnessBadgeClass =
  `inline-flex h-8 shrink-0 items-center rounded-full px-2.5 font-mono text-[10px] font-normal tracking-tight text-muted-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass}`

const chatNewsReadAllButtonClass =
  `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-[-0.01em] text-foreground ${chatMobileGlassSurfaceClass} ${chatMobileHeaderShadowClass} ${chatMobileHeaderShadowHoverClass} transition-[transform,background-color,box-shadow] active:scale-[0.98] hover:bg-white/88 dark:hover:bg-white/[0.12] [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:opacity-70`

/** News cards / tape — same liquid glass language as signal cards. */
const chatNewsGlassCardClass = chatSignalCardClass
const chatNewsGlassInsetClass = chatSignalCardInsetClass
const chatNewsGlassTileClass = chatSignalCardMetricTileClass
const chatNewsGlassChipClass = chatSignalCardChipClass


export {
  chatMobileAssistantClass,
  chatMobileComposerIconButtonClass,
  chatMobileComposerIconButtonCompactClass,
  chatMobileComposerPillClass,
  chatMobileComposerPillCompactClass,
  chatMobileComposerPillExpandedClass,
  chatMobileComposerLeadingClass,
  chatMobileComposerTrailingClass,
  chatMobileComposerTextareaClass,
  chatMobileComposerTextareaCompactClass,
  chatMobileComposerTextareaExpandedClass,
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
  chatMobileHeaderShellClass,
  chatMobileHeaderScrimClass,
  chatMobileComposerDockClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderNewChatClass,
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderAvatarClass,
  chatMobileHeaderPlanBadgeClass,
  chatMobileHeaderModelPrimaryClass,
  chatMobileHeaderModelSecondaryClass,
  chatMobilePrimaryButtonClass,
  chatNewsFreshnessBadgeClass,
  chatNewsGlassCardClass,
  chatNewsGlassChipClass,
  chatNewsGlassInsetClass,
  chatNewsGlassTileClass,
  chatNewsPanelHeaderClass,
  chatNewsPanelShellClass,
  chatNewsPanelShellMobileClass,
  chatNewsReadAllButtonClass,
  chatSignalCardChipClass,
  chatSignalCardClass,
  chatSignalCardEntryShellClass,
  chatSignalCardIconShellClass,
  chatSignalCardInsetClass,
  chatSignalCardMetricTileClass,
  chatMobileScrollDownClass,
  chatEmptyHeroPromptsClass,
  chatSamplePromptButtonClass,
  chatSamplePromptCarouselClass,
  chatSamplePromptCarouselContentClass,
  chatSamplePromptCarouselDotsClass,
  chatSamplePromptCarouselItemClass,
  chatSamplePromptStaticListClass,
  chatSamplePromptDescriptionClass,
  chatSamplePromptIconClass,
  chatSamplePromptTextClass,
  chatSamplePromptTitleClass,
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
  chatLoginConsentBrandMarkClass,
  chatLoginConsentDialogClass,
  chatMobileThreadClass,
  chatMobileThreadFirstTurnClass,
  chatMobileThreadTopSpacerClass,
  chatMobileThreadBottomSpacerClass,
  chatMobileThreadBottomFadeClass,
  chatMobileThreadScrollMaskClass,
  chatMobileToolsMenuClass,
  chatMobileToolsMenuItemClass,
  chatMobileToolsMenuItemDescClass,
  chatMobileToolsMenuItemTitleClass,
  chatMobileToolsMenuLabelClass,
  chatMobileUserBubbleClass,
  chatMobileUserBubbleInteractiveClass,
}
