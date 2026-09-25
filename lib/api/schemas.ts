import { z } from "zod"

import type { ChatMessageResponse, TokenPair, User } from "@/lib/api/types"

export const tokenPairSchema = z.object({
  access_token: z.string().min(1),
  expires_at: z.string().min(1),
  token_type: z.string().optional(),
})

export const userSchema = z
  .object({
    id: z.string().min(1),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullish(),
    /** Present for X-linked accounts; absent for Google-only users. */
    x_id: z.string().nullish(),
    x_username: z.string().nullish(),
    x_name: z.string().nullish(),
    x_profile_image_url: z.string().nullish(),
    profile_image_url: z.string().nullish(),
    x_verified: z.boolean().nullish().default(false),
    email: z.string().nullish(),
    wallet_address: z.string().nullish(),
    tier: z.enum(["free", "pro", "ultimate"]),
    role: z.string(),
    trial_started_at: z.string().nullish(),
    trial_ends_at: z.string().nullish(),
    pro_expires_at: z.string().nullish(),
    last_login_at: z.string(),
    referred_by_id: z.string().nullish(),
  })
  .passthrough()

/** Soft validation for SSE `done` — keeps unknown fields. */
export const chatMessageResponseSchema = z
  .object({
    session_id: z.string().optional(),
    output_text: z.string().optional(),
    reasoning: z.string().optional(),
    tool_calls: z.array(z.unknown()).optional(),
    client_actions: z.array(z.unknown()).optional(),
    suggested_actions: z.array(z.string()).optional(),
    tokens_used: z.number().optional(),
    credit_balance: z.unknown().optional(),
    trial: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
    code: z.string().optional(),
    user_message: z.unknown().optional(),
    assistant_message: z.unknown().optional(),
  })
  .passthrough()

export function parseTokenPair(input: unknown): TokenPair {
  const parsed = tokenPairSchema.parse(input)
  return {
    access_token: parsed.access_token,
    expires_at: parsed.expires_at,
    token_type: parsed.token_type ?? "Bearer",
  }
}

export function parseUser(input: unknown): User {
  return userSchema.parse(input) as User
}

export function parseChatMessageResponse(
  input: unknown
): ChatMessageResponse | null {
  const result = chatMessageResponseSchema.safeParse(input)
  if (!result.success) return null
  return result.data as ChatMessageResponse
}
