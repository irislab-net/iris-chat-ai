import type { MarketStateKind } from "@/lib/market-state-action"

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

/** Call after a user gesture so background/tab chimes can play. */
export function unlockMarketStanceAudio(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  void ctx.resume().then(() => {
    unlocked = true
  })
}

function partial(
  ctx: AudioContext,
  dest: AudioNode,
  {
    frequency,
    start,
    duration,
    gain = 0.06,
    type = "sine",
    attack = 0.012,
  }: {
    frequency: number
    start: number
    duration: number
    gain?: number
    type?: OscillatorType
    attack?: number
  }
) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), start + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(dest)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

/** Bright glass ping for LONG — rising major sparkle. */
function playLongChime(ctx: AudioContext, t0: number) {
  const master = ctx.createGain()
  master.gain.value = 0.9
  const filter = ctx.createBiquadFilter()
  filter.type = "highshelf"
  filter.frequency.value = 1800
  filter.gain.value = 4
  master.connect(filter)
  filter.connect(ctx.destination)

  // C5 → E5 → G5 (major arpeggio up)
  const notes = [
    { f: 523.25, at: 0, dur: 0.22, g: 0.055 },
    { f: 659.25, at: 0.1, dur: 0.26, g: 0.07 },
    { f: 783.99, at: 0.22, dur: 0.55, g: 0.085 },
  ]
  for (const n of notes) {
    const start = t0 + n.at
    partial(ctx, master, {
      frequency: n.f,
      start,
      duration: n.dur,
      gain: n.g,
      type: "sine",
    })
    // Soft harmonic shimmer
    partial(ctx, master, {
      frequency: n.f * 2,
      start,
      duration: n.dur * 0.7,
      gain: n.g * 0.22,
      type: "triangle",
      attack: 0.008,
    })
  }
}

/** Dark low drop for SHORT — falling fifth + soft thud. */
function playShortChime(ctx: AudioContext, t0: number) {
  const master = ctx.createGain()
  master.gain.value = 0.95
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.setValueAtTime(2400, t0)
  filter.frequency.exponentialRampToValueAtTime(520, t0 + 0.45)
  filter.Q.value = 0.7
  master.connect(filter)
  filter.connect(ctx.destination)

  // G4 → C4 (perfect fifth down) — heavier body
  partial(ctx, master, {
    frequency: 392.0,
    start: t0,
    duration: 0.28,
    gain: 0.08,
    type: "triangle",
  })
  partial(ctx, master, {
    frequency: 261.63,
    start: t0 + 0.14,
    duration: 0.62,
    gain: 0.11,
    type: "sine",
    attack: 0.018,
  })
  // Sub weight so it feels unmistakably “down”
  partial(ctx, master, {
    frequency: 130.81,
    start: t0 + 0.14,
    duration: 0.5,
    gain: 0.045,
    type: "sine",
    attack: 0.03,
  })
  // Soft click so short reads as a different family of sound
  partial(ctx, master, {
    frequency: 880,
    start: t0,
    duration: 0.06,
    gain: 0.035,
    type: "square",
    attack: 0.004,
  })
}

/** Distinct chimes: LONG = bright rising sparkle, SHORT = dark falling drop. */
export async function playMarketStanceChime(
  kind: "long" | "short"
): Promise<void> {
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

  const t0 = ctx.currentTime + 0.02
  if (kind === "long") playLongChime(ctx, t0)
  else playShortChime(ctx, t0)
}

export type NotifyStanceResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | "unsupported"
        | "denied"
        | "blocked"
        | "insecure"
        | "default"
        | "error"
      detail?: string
    }

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported"
  }
  return Notification.permission
}

/** Only call from a direct user gesture (Allow button). */
export async function requestStanceAlertPermission(): Promise<NotifyStanceResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "unsupported" }
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: "insecure" }
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission === "granted") return { ok: true }
    return { ok: false, reason: "denied" }
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      detail: error instanceof Error ? error.message : "permission failed",
    }
  }
}

export async function notifyMarketStanceChange(input: {
  kind: "long" | "short"
  symbol?: string
}): Promise<NotifyStanceResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, reason: "unsupported" }
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: "insecure" }
  }

  // Do not prompt here — permission is requested only via the alerts dialog.
  if (Notification.permission === "default") {
    return { ok: false, reason: "default" }
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "denied" }
  }

  const title =
    input.kind === "long" ? "Market lean: LONG" : "Market lean: SHORT"
  const body = input.symbol
    ? `${input.symbol} stance flipped to ${input.kind.toUpperCase()}.`
    : `Stance flipped to ${input.kind.toUpperCase()}.`

  try {
    // Prefer SW notifications when available (more reliable on macOS Chrome).
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: "iris-market-stance",
        silent: false,
      })
      return { ok: true }
    }

    const n = new Notification(title, {
      body,
      tag: "iris-market-stance",
      silent: false,
      requireInteraction: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
    window.setTimeout(() => n.close(), 8000)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: "blocked",
      detail: error instanceof Error ? error.message : "show failed",
    }
  }
}

export function isDirectionalStance(
  kind: MarketStateKind
): kind is "long" | "short" {
  return kind === "long" || kind === "short"
}
