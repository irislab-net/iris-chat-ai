"use client"

import * as React from "react"

function createNowStore() {
  let snapshot = Date.now()
  let timer: number | null = null
  const listeners = new Set<() => void>()

  function emit() {
    snapshot = Date.now()
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    if (!timer) {
      emit()
      timer = window.setInterval(emit, 1_000)
    }
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0 && timer) {
        window.clearInterval(timer)
        timer = null
      }
    }
  }

  function getSnapshot() {
    return snapshot
  }

  return { subscribe, getSnapshot }
}

const nowStore = createNowStore()

export function useNow(active: boolean) {
  return React.useSyncExternalStore(
    active ? nowStore.subscribe : () => () => {},
    active ? nowStore.getSnapshot : () => 0,
    () => 0
  )
}
