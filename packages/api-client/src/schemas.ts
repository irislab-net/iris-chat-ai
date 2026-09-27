import { z } from "zod"

import type { ChatMessageResponse, TokenPair } from "./types"

export const tokenPairSchema = z.object({
  access_token: z.string().min(1),
  expires_at: z.string().min(1),
  token_type: z.string().optional(),
  refresh_token: z.string().optional(),
})

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
    ...(parsed.refresh_token ? { refresh_token: parsed.refresh_token } : {}),
  }
}

export function parseChatMessageResponse(
  input: unknown
): ChatMessageResponse | null {
  const result = chatMessageResponseSchema.safeParse(input)
  if (!result.success) return null
  return result.data as ChatMessageResponse
}
