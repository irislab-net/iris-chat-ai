/**
 * Narration for the "Meet Exur" orb experience.
 *
 * Cue boundaries are not guesses: they come from the pauses ffmpeg's
 * `silencedetect` found in the actual recording. Re-derive them with
 * `pnpm narration:cues` whenever the audio file changes.
 */

/** Canonical CDN asset (server proxy + cue tooling). */
export const ABOUT_NARRATION_CDN =
  "https://files.exur.ai/ex/en/intro-voice.mp3"

/**
 * Browser playback URL — same-origin proxy so WebAudio can analyse the track.
 * The CDN itself does not send CORS headers.
 */
export const ABOUT_NARRATION_SRC = "/media/about-narration"

/** @deprecated Prefer ABOUT_NARRATION_CDN for server tooling. */
export const ABOUT_NARRATION_ORIGIN = "https://files.exur.ai"

/** Real length of the file, so the experience knows when to close itself. */
export const ABOUT_NARRATION_DURATION = 61.96

export type NarrationCue = {
  /** Seconds from the start of the track. */
  start: number
  /** Held until the next line starts, so captions never blank out mid-pause. */
  end: number
  text: string
}

export const ABOUT_NARRATION_CUES: NarrationCue[] = [
  { start: 0, end: 2.71, text: "Hello, I am Exur." },
  {
    start: 2.71,
    end: 7.89,
    text: "I am not just another chatbot, trading signal, or portfolio tracker.",
  },
  { start: 7.89, end: 10.43, text: "I am your Financial Brain." },
  {
    start: 10.43,
    end: 14.19,
    text: "Today, the global financial world is overwhelming —",
  },
  {
    start: 14.19,
    end: 19.55,
    text: "filled with constant noise, complex order books, and endless data.",
  },
  {
    start: 19.55,
    end: 22.81,
    text: "Institutions handle this with armies of experts,",
  },
  {
    start: 22.81,
    end: 26.93,
    text: "while individuals are left alone with spreadsheets and charts.",
  },
  { start: 26.93, end: 28.84, text: "I bridge that gap." },
  {
    start: 28.84,
    end: 37.13,
    text: "I observe global markets, analyze microstructure, order flow, and news,",
  },
  {
    start: 37.13,
    end: 41.27,
    text: "and combine them with an understanding of you — your goals, your portfolio, and your risk.",
  },
  {
    start: 41.27,
    end: 46.15,
    text: "I don't just predict what the market might do; I tell you what you should do.",
  },
  { start: 46.15, end: 47.81, text: "And when there's no edge?" },
  { start: 47.81, end: 50.69, text: "I'll simply say: \u201cDo nothing.\u201d" },
  {
    start: 50.69,
    end: 55.98,
    text: "I am Exur — the intelligence layer responsible for your financial life.",
  },
  {
    start: 55.98,
    end: 59.33,
    text: "Experience your new financial intelligence today.",
  },
  { start: 59.33, end: ABOUT_NARRATION_DURATION, text: "Start chatting with me now." },
]

/** Cue index for `time`, or -1 before the first line / after the last. */
export function cueIndexAt(time: number): number {
  return ABOUT_NARRATION_CUES.findIndex(
    (cue) => time >= cue.start && time < cue.end
  )
}
