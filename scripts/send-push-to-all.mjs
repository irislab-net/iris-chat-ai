#!/usr/bin/env node
/**
 * Send ONE push notification to ALL web users (FCM topic broadcast).
 *
 * Every browser that opened the site with notifications enabled is
 * subscribed to the `exur-announcements` topic by /api/push/subscribe,
 * so a single message to that topic fans out to all of them.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" \
 *     node scripts/send-push-to-all.mjs --title "Exur" --body "…"
 *   # or: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node …
 * Options: --title, --body, --url (default "/"), --topic (default below)
 *
 * The service account needs the Firebase Cloud Messaging Admin role on
 * the project. Its JSON is a secret — never commit it.
 */
import { createSign } from "node:crypto"
import { readFileSync } from "node:fs"

const TOPIC = "exur-announcements"
const PROJECT_ID = "exur-main"

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function loadServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
      : null)
  if (!raw) {
    console.error(
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
    )
    process.exit(1)
  }
  const account = JSON.parse(raw)
  if (!account.client_email || !account.private_key) {
    console.error("Service account JSON is missing client_email/private_key.")
    process.exit(1)
  }
  return account
}

const b64url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

async function getAccessToken(account) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  )
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  const assertion = `${header}.${claims}.${b64url(signer.sign(account.private_key))}`
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.access_token) {
    console.error(`Google OAuth failed (${res.status})`, body)
    process.exit(1)
  }
  return body.access_token
}

const title = arg("title", "Exur")
const body = arg("body", "You have a new update from Exur.")
const url = arg("url", "/")
const topic = arg("topic", TOPIC)

const account = loadServiceAccount()
const accessToken = await getAccessToken(account)
const projectId = account.project_id ?? PROJECT_ID

const res = await fetch(
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        topic,
        notification: { title, body },
        data: { type: "announcement", url },
        webpush: {
          notification: { icon: "/icon-192.png", badge: "/favicon-48.png" },
          fcm_options: { link: url },
        },
      },
    }),
  }
)
const result = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error(`FCM send failed (${res.status})`, result)
  process.exit(1)
}
console.log(`Sent to all web users on topic "${topic}":`, result.name)
