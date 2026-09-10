/** Action-oriented signal prompts — routed through the paper-trade pipeline. */

function hasPersianScript(text: string): boolean {
  return /[\u0600-\u06FF]/u.test(text)
}

export function buildActionSignalPrompt(asset: string): string {
  const trimmed = asset.trim()
  if (!trimmed) return ""

  if (hasPersianScript(trimmed)) {
    return `درخواست میز معاملاتی برای ${trimmed}. از تمام شواهد IRIS استفاده کن: قیمت زنده، روند چند تایم‌فریم، نوسان، پیش‌بینی مدل‌ها (1m/1h/1d)، stance، bias و اخبار. همه را ترکیب کن — وقتی داده داری، به «کنار بمان» یا «صبر کن» پیش‌فرض نرو.

وظیفه: بهترین ستاپ قابل اجرا را پیدا کن و یک paper trade با open_paper_trade پیشنهاد بده: جهت (LONG یا SHORT)، stop loss، take profit، leverage، نام ستاپ و thesis مبتنی بر شواهد.

قوانین:
- بازار range/ sideways هم می‌تواند معامله داشته باشد (mean-reversion، breakout، edge مدل).
- entry نزدیک قیمت زنده؛ SL/TP باید عدد مطلق در سمت درست قیمت باشد.
- فقط no_trade وقتی داده stale/ناقص است یا SL/TP امن قابل تعریف نیست.

خروجی باید معامله مشخص و قابل اجرا باشد — نه فقط تحلیل منفی.`
  }

  return `Trading desk request for ${trimmed}. Use ALL available IRIS evidence: live price, multi-timeframe trend, volatility, model predictions (1m/1h/1d), stance, bias, and news. Synthesize everything — do not default to "stand aside" or "wait" when data exists.

Your job: find the BEST actionable setup right now and propose ONE paper trade via open_paper_trade with direction (LONG or SHORT), stop loss, take profit, leverage, setup name, and thesis tied to the evidence.

Rules:
- Range/sideways markets STILL allow trades (mean-reversion, breakout, model edge) — pick the strongest setup from the data.
- Anchor entry near live price; SL/TP must be absolute prices on the correct side.
- Use no_trade ONLY if data is stale/missing OR no safe levels exist.

Output a concrete trade the user can execute — not analysis-only refusal.`
}

export const ETH_SIGNAL_SAMPLE_PROMPT = buildActionSignalPrompt("ETH")

export const ETH_SIGNAL_SAMPLE_PROMPT_FA = buildActionSignalPrompt("اتریوم")

export type IrisComposerQuickPrompt = {
  id: string
  label: string
  text: string
}

export const IRIS_COMPOSER_QUICK_PROMPTS: IrisComposerQuickPrompt[] = [
  {
    id: "eth-signal",
    label: "ETH signal",
    text: ETH_SIGNAL_SAMPLE_PROMPT,
  },
  {
    id: "eth-signal-fa",
    label: "سیگنال ETH",
    text: ETH_SIGNAL_SAMPLE_PROMPT_FA,
  },
  {
    id: "market-pulse",
    label: "Market pulse",
    text: "What is IRIS stance, model bias, and the news pulse on ETH right now? Signal only if a setup is clear — otherwise analysis only.",
  },
]
