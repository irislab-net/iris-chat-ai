import { describe, expect, it } from "vitest"

import {
  buildBroadcastMessage,
  buildTopicSubscribeUrl,
  isPlausibleFcmToken,
  PUSH_BROADCAST_TOPIC,
} from "@/lib/server/push-topic"

describe("push topic server helpers", () => {
  it("builds the FCM topic-subscription URL", () => {
    expect(buildTopicSubscribeUrl("exur-main", "tok:en")).toBe(
      "https://fcm.googleapis.com/v1/projects/exur-main/registrations/tok%3Aen/topicSubscriptions?topic_name=exur-announcements"
    )
    expect(PUSH_BROADCAST_TOPIC).toBe("exur-announcements")
  })

  it("accepts only plausible FCM tokens", () => {
    expect(isPlausibleFcmToken("a".repeat(120))).toBe(true)
    expect(isPlausibleFcmToken("short")).toBe(false)
    expect(isPlausibleFcmToken("has spaces ".repeat(20))).toBe(false)
    expect(isPlausibleFcmToken(42)).toBe(false)
    expect(isPlausibleFcmToken(null)).toBe(false)
  })

  it("builds a broadcast message for all web users", () => {
    const payload = buildBroadcastMessage({
      title: "Exur",
      body: "Hello everyone",
    })
    expect(payload.message.topic).toBe("exur-announcements")
    expect(payload.message.notification).toEqual({
      title: "Exur",
      body: "Hello everyone",
    })
    expect(payload.message.webpush.fcm_options.link).toBe("/")
  })
})
