export type UserTier = "free" | "pro" | "ultimate"

export type User = {
  id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  x_id: string
  x_username: string
  x_name: string
  x_profile_image_url: string
  /** Google OAuth / generic profile image when x_profile_image_url is empty. */
  profile_image_url?: string | null
  x_verified: boolean
  email?: string | null
  wallet_address?: string | null
  tier: UserTier
  role: string
  trial_started_at?: string | null
  trial_ends_at?: string | null
  pro_expires_at?: string | null
  last_login_at: string
  referred_by_id?: string | null
}

export type TokenPair = {
  access_token: string
  expires_at: string
  token_type: "Bearer" | string
}

export type Classifier = {
  p: number
  p0: number
  thr: number
  margin: number
  edge: number
  policy: number
  signal: boolean
  policy_signal: boolean
}

export type Prediction = {
  uuid: string
  market: string
  timestamp: number
  created_at: number
  classifiers: {
    long: Classifier
    short: Classifier
    breakout: Classifier
    fast: Classifier
  }
  geometry: {
    vol: number
    mfe: number
    mae: number
    rr: number
  }
}

export type InsightSummary = {
  id: number
  generated_at: number
  created_at: number
  symbol: string
  timeframe: string
  stance: string
  bias: string
  headline: string
  explanation: string
  calmness_label: string
  reward_risk_ratio: number
  expected_move_pct: number
}

export type InsightHome = {
  summary: InsightSummary
  predictions: Prediction[]
}

export type NewsAssetMetrics = {
  confidence: number
  relevance: number
  score: number
}

export type NewsItem = {
  id: string
  title: string
  summary: string
  source: string
  url: string
  published_at: number
  metrics: {
    impact_score: number
    overall_sentiment: number
    assets: {
      btc: NewsAssetMetrics
      eth: NewsAssetMetrics
      dxy: NewsAssetMetrics
      xau: NewsAssetMetrics
    }
  }
}

export type NewsTimeframe = {
  volume: number
  avg_impact: number
  assets: Record<string, { weighted_sentiment: number }>
}

export type NewsAnalytics = {
  id: number
  generated_at: number
  created_at: number
  timeframes: Record<string, NewsTimeframe>
  ai_summaries: {
    macro?: string
    btc?: string
    eth?: string
    dxy?: string
    xau?: string
  }
}

export type NewsHome = {
  analytics: NewsAnalytics[]
  news: NewsItem[]
}

export type ApiEnvelope<T> = {
  success: boolean
  meta?: Record<string, unknown>
  data?: T
  error?: string
}

export type CoPilotHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export type CoPilotUsage = {
  plan: string
  used: number | string
  limit: number | string
  remaining: number | string
  day: string
}

export type CoPilotEffort = "instant" | "medium" | "high"

export type ChatApiEffort = "normal" | "high" | "ultimate"

export type ChatClientContext = {
  active_page: string
  active_symbol?: string
  role: string
  locale?: string
  timezone?: string
  available_ui_actions?: string[]
  capabilities?: string[]
  timeframe?: string
  open_positions?: Array<{
    id: string
    symbol: string
    side: string
    quantity: number
    entry_price: number
    mark_price: number
    stop_loss: number | null
    take_profit: number | null
    leverage: number
    margin_mode: string
    unrealized_pnl: number
  }>
  draft_order?: {
    side: string
    quantity: number
    stop_loss: number | null
    take_profit: number | null
  } | null
  paper_account?: {
    starting_balance: number
    balance: number
    equity: number
    available_balance: number
    risk_per_trade: number
    risk_fraction: number
  } | null
}

export type ChatToolCallResult = {
  tool_name: string
  execution_target: "server" | "client"
  input: string | Record<string, unknown>
  output?: string
}

export type ChatCreditBalance = {
  remaining_daily: number
  remaining_weekly: number
  daily_limit: number
  weekly_limit: number
  daily_reset_at: string
  weekly_reset_at: string
}

export type TrialInfo = {
  is_guest?: boolean
  messages_limit: number
  messages_used: number
  messages_remaining: number
  weekly_reset_at: string
}

export type MessageQuote = {
  id: number
  role: "user" | "assistant"
  excerpt: string
  created_at: string
}

export type PersistedMessageRef = {
  id: number
  created_at: string
  reply_to_id?: number
  reply_to?: MessageQuote
}

export type SessionPreview = {
  role: "user" | "assistant" | string
  content: string
}

export type SessionListItem = {
  session_id: string
  title: string
  pinned: boolean
  last_message_at: string
  first_message_at: string
  message_count: number
  preview: SessionPreview
}

export type SessionListResult = {
  items: SessionListItem[]
  limit: number
  offset: number
  total: number
}

export type TradeSignalItem = {
  uid: string
  session_id: string
  channel?: string
  source: "signal_command" | "chat_tool"
  outcome: "signal" | "no_trade"
  final_status: "tp_hit" | "sl_hit" | "expired" | null
  content_hash: string
  created_at: string
  hash_ok: boolean
  symbol?: string
  direction?: string
  setup?: string
  entry?: number
  stop_loss?: number
  take_profit?: number
  entry_reason?: string
  stop_loss_reason?: string
  take_profit_reason?: string
  leverage?: number
  time_horizon?: string
  thesis?: string
  rr_ratio?: number
  no_trade_reason?: string
}

export type ChatMessageResponse = {
  session_id?: string
  output_text?: string
  /** Joined hidden reasoning across model passes (SSE `done` / history). */
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

export type CoPilotChatRequest = {
  message: string
  stream: boolean
  conversation_id: string
  messages: CoPilotHistoryMessage[]
  effort?: CoPilotEffort
  tools?: CoPilotToolDefinition[]
  tool_choice?: "required" | "auto" | "none"
  parallel_tool_calls?: boolean
  instructions?: string
  client_context?: ChatClientContext
}

export type CoPilotToolDefinition = {
  type: "function"
  function: {
    name: string
    description: string
    strict: true
    parameters: Record<string, unknown>
  }
}

export type CoPilotToolCall = {
  id?: string
  type?: "function"
  name?: string
  arguments?: string | Record<string, unknown>
  function?: {
    name?: string
    arguments?: string | Record<string, unknown>
  }
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
  user?: { userId?: string }
  tool_calls?: CoPilotToolCall[]
  client_actions?: ChatToolCallResult[]
  suggestedPrompts?: string[]
  user_message?: PersistedMessageRef
  assistant_message?: PersistedMessageRef
  choices?: Array<{
    message?: {
      content?: string | null
      tool_calls?: CoPilotToolCall[]
    }
  }>
}

export type CoPilotUsageResponse = {
  usage?: CoPilotUsage
  credit_balance?: ChatCreditBalance
  trial?: TrialInfo
  user?: { userId?: string }
  error?: string
}
