import { createSign } from "node:crypto"

/**
 * Server-side FCM topic management + broadcast for web push.
 *
 * Web clients cannot subscribe themselves to topics (the JS SDK has no
 * subscribeToTopic), so after a browser obtains its FCM token it calls
 * `POST /api/push/subscribe` and this module subscribes the token to
 * PUSH_BROADCAST_TOPIC via the FCM topic-subscription API. Sending one
 * message to that topic then reaches every subscribed web user:
 *   POST https://fcm.googleapis.com/v1/projects/exur-main/messages:send
 *   { "message": { "topic": "exur-announcements", "notification": {…} } }
 * (docs: firebase.google.com/docs/cloud-messaging/manage-topic-subscriptions)
 *
 * Credentials: a service-account JSON in the FIREBASE_SERVICE_ACCOUNT_JSON
 * env var (Cloudflare secret — never NEXT_PUBLIC_*). Without it every
 * function here reports `configured: false` and callers no-op.
 */

export const PUSH_BROADCAST_TOPIC = "exur-announcements"
export const FIREBASE_PROJECT_ID = "exur-main"

const MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

export type ServiceAccount = {
  client_email: string
  private_key: string
  project_id?: string
}

export function readServiceAccount(
  raw: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
): ServiceAccount | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>
    if (!parsed.client_email || !parsed.private_key) return null
    return parsed as ServiceAccount
  } catch {
    return null
  }
}

export function isPushServerConfigured(): boolean {
  return readServiceAccount() !== null
}

/** FCM registration tokens are long opaque strings; reject anything else. */
export function isPlausibleFcmToken(token: unknown): token is string {
  return (
    typeof token === "string" &&
    token.length >= 80 &&
    token.length <= 4096 &&
    /^[A-Za-z0-9_\-:.]+$/.test(token)
  )
}

export function buildTopicSubscribeUrl(
  projectId: string,
  token: string,
  topic: string = PUSH_BROADCAST_TOPIC
): string {
  return (
    `https://fcm.googleapis.com/v1/projects/${projectId}` +
    `/registrations/${encodeURIComponent(token)}/topicSubscriptions` +
    `?topic_name=${encodeURIComponent(topic)}`
  )
}

export function buildBroadcastMessage(input: {
  title: string
  body: string
  url?: string
  sessionId?: string
  topic?: string
}) {
  const data: Record<string, string> = { type: "announcement" }
  if (input.url) data.url = input.url
  if (input.sessionId) data.session_id = input.sessionId
  return {
    message: {
      topic: input.topic ?? PUSH_BROADCAST_TOPIC,
      notification: { title: input.title, body: input.body },
      data,
      webpush: {
        notification: { icon: "/icon-192.png", badge: "/favicon-48.png" },
        fcm_options: { link: input.url ?? "/" },
      },
    },
  } as const
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/** Mint a Google OAuth2 access token from the service account (RS256 JWT). */
export async function getGoogleAccessToken(
  account: ServiceAccount,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: MESSAGING_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    })
  )
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  const signature = base64Url(signer.sign(account.private_key))
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string
  }
  if (!res.ok || !body.access_token) {
    throw new Error(`google oauth failed (${res.status})`)
  }
  return body.access_token
}

export async function subscribeTokenToBroadcastTopic(
  token: string
): Promise<{ ok: boolean; configured: boolean; status?: number }> {
  const account = readServiceAccount()
  if (!account) return { ok: false, configured: false }
  const accessToken = await getGoogleAccessToken(account)
  const projectId = account.project_id ?? FIREBASE_PROJECT_ID
  const res = await fetch(buildTopicSubscribeUrl(projectId, token), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  })
  // 409 = already subscribed — that is success for our purposes.
  return { ok: res.ok || res.status === 409, configured: true, status: res.status }
}
