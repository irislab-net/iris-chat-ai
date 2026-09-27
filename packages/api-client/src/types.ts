export type TokenPair = {
  access_token: string
  expires_at: string
  token_type?: string
  /** Present for extension OAuth; web keeps refresh in HttpOnly cookie. */
  refresh_token?: string
}

export type TrialInfo = {
  is_guest?: boolean
  messages_limit: number
  messages_used: number
  messages_remaining: number
  weekly_reset_at: string
}

export type ChatCreditBalance = {
  remaining_daily: number
  remaining_weekly: number
  daily_limit: number
  weekly_limit: number
  daily_reset_at: string
  weekly_reset_at: string
}

export type PersistedMessageRef = {
  id: number
  created_at: string
  reply_to_id?: number
}

export type ChatToolCallResult = {
  tool_name: string
  input?: string | Record<string, unknown>
  execution_target?: string
}

export type ChatMessageResponse = {
  session_id?: string
  output_text?: string
  reasoning?: string
  tool_calls?: ChatToolCallResult[]
  client_actions?: ChatToolCallResult[]
  suggested_actions?: string[]
  tokens_used?: number
  credit_balance?: ChatCreditBalance
  trial?: TrialInfo
  metadata?: Record<string, unknown>
  error?: string
  code?: string
  user_message?: PersistedMessageRef
  assistant_message?: PersistedMessageRef
}

export type CoPilotUsage = {
  plan?: string
  used?: number | string
  limit?: number
  remaining?: number
  day?: string
}

export type CoPilotEffort = "instant" | "normal" | "high" | "ultimate"

export type ChatApiEffort = "normal" | "high" | "ultimate"

export type CoPilotHistoryMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export type ChatClientContext = {
  active_page?: string
  active_symbol?: string
  role?: string
  available_ui_actions?: string[]
  [key: string]: unknown
}

export type CoPilotChatJsonResponse = {
  message?: string
  output_text?: string
  reasoning?: string
  conversation_id?: string
  session_id?: string
  usage?: CoPilotUsage
  credit_balance?: ChatCreditBalance
  trial?: TrialInfo
  error?: string
  code?: string
  tool_calls?: Array<{
    name?: string
    arguments?: string | Record<string, unknown>
    function?: { name?: string; arguments?: string | Record<string, unknown> }
  }>
  client_actions?: ChatToolCallResult[]
  suggestedPrompts?: string[]
  user_message?: PersistedMessageRef
  assistant_message?: PersistedMessageRef
}

export type GuestSessionResponse = {
  guest_token: string
  user_id: string
  trial: TrialInfo
}

export type SessionListItem = {
  session_id: string
  title: string
  pinned: boolean
  last_message_at: string
  first_message_at: string
  message_count: number
  preview: { role: string; content: string }
}
