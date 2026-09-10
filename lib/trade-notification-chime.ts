let sharedCtx: AudioContext | null = null
let unlocked = false

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctx) return null
  if (!sharedCtx) sharedCtx = new Ctx()
  return sharedCtx
}

/** Call after a user gesture so trade dings can play. */
export function unlockTradeNotificationAudio(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  void ctx.resume().then(() => {
    unlocked = true
  })
}

/** Short desk ding — distinct from market stance chimes. */
export async function playTradeNotificationDing(): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
      unlocked = true
    } catch {
      return
    }
  }
  if (!unlocked && ctx.state !== "running") return

  const t0 = ctx.currentTime + 0.01
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(740, t0)
  osc.frequency.exponentialRampToValueAtTime(980, t0 + 0.08)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(0.05, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + 0.22)
}
