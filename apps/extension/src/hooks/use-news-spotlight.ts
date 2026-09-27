"use client"

import * as React from "react"

import {
  acknowledgeNewsSpotlightMenu,
  dismissNewsSpotlight,
  EMPTY_NEWS_SPOTLIGHT_STATE,
  getNewsSpotlightState,
  subscribeNewsSpotlight,
} from "@/lib/news-spotlight"

export function useNewsSpotlight(isMobile: boolean) {
  const state = React.useSyncExternalStore(
    subscribeNewsSpotlight,
    getNewsSpotlightState,
    () => EMPTY_NEWS_SPOTLIGHT_STATE
  )

  const dismissed = state.newsOpened === true
  const showMenuSpotlight = isMobile && !dismissed && state.menuOpened !== true
  const showNewsSpotlight =
    !dismissed && (!isMobile || state.menuOpened === true)

  return {
    showMenuSpotlight,
    showNewsSpotlight,
    dismissNewsSpotlight,
    acknowledgeNewsSpotlightMenu,
  }
}
