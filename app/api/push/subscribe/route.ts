import {
  isPlausibleFcmToken,
  subscribeTokenToBroadcastTopic,
} from "@/lib/server/push-topic"

export const dynamic = "force-dynamic"

/**
 * Subscribe a web FCM token to the broadcast topic (`exur-announcements`)
 * so one topic message reaches every web user. Web clients cannot do
 * this themselves — the FCM topic-subscription API needs a Google OAuth
 * bearer, minted here from FIREBASE_SERVICE_ACCOUNT_JSON (server secret).
 * Returns 501 until that secret is configured; the client treats any
 * failure as best-effort and retries on a later visit.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    token?: unknown
  } | null
  if (!isPlausibleFcmToken(body?.token)) {
    return Response.json({ error: "invalid_token" }, { status: 400 })
  }
  try {
    const result = await subscribeTokenToBroadcastTopic(body.token)
    if (!result.configured) {
      return Response.json({ error: "push_not_configured" }, { status: 501 })
    }
    if (!result.ok) {
      return Response.json({ error: "subscribe_failed" }, { status: 502 })
    }
    return Response.json({ subscribed: true })
  } catch {
    return Response.json({ error: "subscribe_failed" }, { status: 502 })
  }
}
