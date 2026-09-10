import {
  PAPER_TRADE_INTENT_PROMPTS,
  PAPER_TRADE_SAMPLE_PROMPT,
} from "@/lib/iris-paper-trade/types"

function compact(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

/**
 * User-initiated paper-trade / signal requests.
 * Regular co-pilot questions (stance, news, “should I long”) stay on the chat path.
 */
export function isPaperTradeIntent(text: string): boolean {
  const raw = compact(text)
  if (!raw) return false

  if (PAPER_TRADE_INTENT_PROMPTS.some((prompt) => compact(prompt) === raw)) {
    return true
  }

  const lower = raw.toLowerCase()

  if (
    /do not (open|propose)( a)?( paper)? trade|don't (open|propose)( a)?( paper)? trade|analysis only|no trade proposal|معامله باز نکن|پیشنهاد نده/i.test(
      raw
    ) &&
    !/open_paper_trade|paper trade via/i.test(raw)
  ) {
    return false
  }

  const asksPaperTrade =
    /paper\s*trade/.test(lower) ||
    /معامله\s*paper/i.test(raw) ||
    /paper\s*trade/i.test(raw)

  const asksSignal =
    /trade\s*signal/.test(lower) ||
    (/سیگنال|signal/i.test(raw) &&
      /(eth|ethereum|اتریوم|btc|bitcoin|بیت|trade|معامله|ترید)/i.test(raw))

  const asksScan =
    /scan\s+live/i.test(lower) ||
    /trading desk request for/i.test(lower) ||
    /use all available iris evidence/i.test(lower) ||
    /درخواست\s+میز\s+معاملاتی/i.test(raw) ||
    (/بررسی\s+کن/.test(raw) && /(اتریوم|ethereum|eth|btc|bitcoin|بیت)/i.test(raw))

  const wantsLevels =
    /entry|sl\b|tp\b|stop\s*loss|take\s*profit|setup|ستاپ|حد\s*ضرر|حد\s*سود/i.test(
      raw
    )

  const asksOpen =
    asksPaperTrade ||
    asksSignal ||
    asksScan ||
    /open (a |one )?paper/.test(lower) ||
    /propose (a |one )?(paper|trade)/.test(lower) ||
    /open_paper_trade/.test(lower) ||
    /پیشنهاد/.test(raw) ||
    (/پوزیشن|position/.test(raw) &&
      /\beth\b|ethereum|اتریوم|btc|bitcoin|بیت/i.test(raw) &&
      (wantsLevels || /short|long|فروش|خرید|buy|sell/i.test(raw)))

  if (asksOpen && (wantsLevels || asksSignal || asksScan)) {
    return true
  }

  if (
    asksPaperTrade &&
    /\beth\b|ethereum|اتریوم|btc|bitcoin|بیت/i.test(raw) &&
    wantsLevels
  ) {
    return true
  }

  return false
}

export function matchesPaperTradeSamplePrompt(text: string): boolean {
  return compact(text) === compact(PAPER_TRADE_SAMPLE_PROMPT)
}
