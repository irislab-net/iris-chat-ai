/**
 * Derives caption timings for the About narration from the audio itself.
 *
 * Runs ffmpeg's `silencedetect` over the track, treats the longest pauses as
 * line breaks, and prints a ready-to-paste `ABOUT_NARRATION_CUES` array. The
 * cue text comes from lib/about-narration.ts, so this only ever recomputes the
 * numbers — the wording stays in one place.
 *
 *   pnpm narration:cues
 *
 * Needs ffmpeg on PATH (brew install ffmpeg).
 */

import { execFile } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = join(ROOT, "lib", "about-narration.ts")

/** Pauses shorter than this are within a sentence, not between lines. */
const MIN_PAUSE = 0.28
const NOISE_FLOOR = "-32dB"

async function probeDuration(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ])
  return Number.parseFloat(stdout.trim())
}

/** Every silent stretch in the file, as {start, end, length}. */
async function detectPauses(file) {
  // silencedetect reports on stderr at info level, and `-f null -` decodes
  // without writing any output.
  const { stderr } = await run("ffmpeg", [
    "-hide_banner",
    "-i", file,
    "-af", `silencedetect=noise=${NOISE_FLOOR}:d=${MIN_PAUSE}`,
    "-f", "null", "-",
  ])

  const pauses = []
  let start = null

  for (const line of stderr.split("\n")) {
    const begin = line.match(/silence_start: (-?[\d.]+)/)
    if (begin) start = Number.parseFloat(begin[1])

    const finish = line.match(/silence_end: (-?[\d.]+)/)
    if (finish && start !== null) {
      const end = Number.parseFloat(finish[1])
      pauses.push({ start, end, length: end - start })
      start = null
    }
  }

  return pauses
}

function quote(text) {
  return JSON.stringify(text)
}

/**
 * Picks which pauses are line breaks.
 *
 * Simply taking the longest pauses does not work: a clause break can outlast a
 * sentence break, and one wrong pick shifts every later line. So instead we
 * choose the set of breaks that best matches how long each line *should* take,
 * estimated from its character count. Exact via dynamic programming — the grid
 * is a few dozen cells wide.
 */
function alignToPauses(cues, pauses, duration) {
  // Candidate boundaries: the start, the end of every pause, and the finish.
  const marks = [0, ...pauses.map((pause) => pause.end), duration]
  const totalChars = cues.reduce((sum, cue) => sum + cue.text.length, 0)
  const expected = cues.map((cue) => (duration * cue.text.length) / totalChars)

  const n = cues.length
  const m = marks.length
  const INF = Number.POSITIVE_INFINITY

  // cost[i][j] = best total error for cues 0..i-1 ending at marks[j].
  const cost = Array.from({ length: n + 1 }, () => new Array(m).fill(INF))
  const from = Array.from({ length: n + 1 }, () => new Array(m).fill(-1))
  cost[0][0] = 0

  for (let i = 1; i <= n; i += 1) {
    for (let j = i; j < m; j += 1) {
      for (let k = i - 1; k < j; k += 1) {
        if (cost[i - 1][k] === INF) continue
        const actual = marks[j] - marks[k]
        if (actual <= 0) continue
        // Relative error, so a long line isn't penalised just for being long.
        const slip = (actual - expected[i - 1]) / expected[i - 1]
        const total = cost[i - 1][k] + slip * slip
        if (total < cost[i][j]) {
          cost[i][j] = total
          from[i][j] = k
        }
      }
    }
  }

  if (cost[n][m - 1] === INF) {
    throw new Error("Could not fit the script to the pauses in this recording.")
  }

  const bounds = new Array(n + 1)
  let j = m - 1
  for (let i = n; i >= 0; i -= 1) {
    bounds[i] = marks[j]
    j = from[i][j]
  }

  return bounds
}

async function main() {
  const narration = await import(SOURCE)
  const cues = narration.ABOUT_NARRATION_CUES
  // ffmpeg reads https directly, so a CDN-hosted track needs no download.
  const src = narration.ABOUT_NARRATION_SRC
  const file = /^https?:\/\//.test(src) ? src : join(ROOT, "public", src)

  const [duration, pauses] = await Promise.all([
    probeDuration(file),
    detectPauses(file),
  ])

  const needed = cues.length - 1
  if (pauses.length < needed) {
    throw new Error(
      `Found only ${pauses.length} pauses but need ${needed} line breaks. ` +
        `Lower MIN_PAUSE or split the script into fewer lines.`
    )
  }

  const bounds = alignToPauses(cues, pauses, duration)

  console.log(`// ${file.replace(ROOT + "/", "")} — ${duration.toFixed(2)}s`)
  console.log(`export const ABOUT_NARRATION_DURATION = ${duration.toFixed(2)}\n`)
  console.log("export const ABOUT_NARRATION_CUES: NarrationCue[] = [")
  cues.forEach((cue, i) => {
    const start = bounds[i].toFixed(2)
    const end = bounds[i + 1].toFixed(2)
    console.log(`  { start: ${start}, end: ${end}, text: ${quote(cue.text)} },`)
  })
  console.log("]")

  console.log(`\n// ${pauses.length} pauses detected, ${needed} chosen as breaks.`)

  // The fit assumes a steady speaking rate, so it reads a dramatic pause inside
  // a line as a line break. Point at the lines worth checking by ear.
  const totalChars = cues.reduce((sum, cue) => sum + cue.text.length, 0)
  const suspect = cues
    .map((cue, i) => {
      const actual = bounds[i + 1] - bounds[i]
      const expected = (duration * cue.text.length) / totalChars
      return { text: cue.text, ratio: actual / expected }
    })
    .filter((line) => line.ratio < 0.6 || line.ratio > 1.6)

  if (suspect.length) {
    console.log("// Check these by ear — they ran much shorter or longer than their text:")
    for (const line of suspect) {
      console.log(`//   ${line.ratio.toFixed(2)}x  ${line.text.slice(0, 60)}`)
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(`\nFailed: ${error.message}`)
  process.exit(1)
}
