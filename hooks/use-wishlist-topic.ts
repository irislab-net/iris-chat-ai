"use client"

import * as React from "react"

import {
  ensureWishlistTopic,
  fetchWishlistTopics,
  isWishlistTopicSubscribed,
  removeWishlistTopic,
} from "@/lib/api/wishlist"

export function useWishlistTopic(topic: string, enabled: boolean) {
  const [subscribed, setSubscribed] = React.useState(false)
  const [checked, setChecked] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const syncMembership = React.useCallback(async () => {
    const topics = await fetchWishlistTopics()
    const onList = isWishlistTopicSubscribed(topics, topic)
    setSubscribed(onList)
    setChecked(true)
    return onList
  }, [topic])

  React.useEffect(() => {
    if (!enabled) return

    let cancelled = false

    void Promise.resolve()
      .then(() => {
        if (cancelled) return
        setLoading(true)
        setChecked(false)
        setError(null)
        return syncMembership()
      })
      .catch((caught) => {
        if (cancelled) return
        setError(
          caught instanceof Error ? caught.message : "Could not load waitlist"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, syncMembership])

  const subscribe = React.useCallback(async () => {
    if (pending) return

    setPending(true)
    setError(null)
    try {
      if (checked && subscribed) return

      const alreadyOnList = checked ? subscribed : await syncMembership()
      if (alreadyOnList) return

      await ensureWishlistTopic(topic)
      setSubscribed(true)
      setChecked(true)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not join waitlist"
      )
    } finally {
      setPending(false)
    }
  }, [checked, pending, subscribed, syncMembership, topic])

  const unsubscribe = React.useCallback(async () => {
    setPending(true)
    setError(null)
    try {
      await removeWishlistTopic(topic)
      setSubscribed(false)
      setChecked(true)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not leave waitlist"
      )
    } finally {
      setPending(false)
    }
  }, [topic])

  return {
    subscribed: enabled ? subscribed : false,
    checked: enabled ? checked : false,
    loading: enabled ? loading : false,
    pending: enabled ? pending : false,
    error: enabled ? error : null,
    subscribe,
    unsubscribe,
  }
}
