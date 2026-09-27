import { SIGNAL_SETUP_HEADER } from "@/lib/chat/signal-setup-constants"

/** Remove an appended IRIS paper-setup block from a regular co-pilot reply. */
export function stripUnrequestedIrisSetupFromReply(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const index = trimmed.indexOf(SIGNAL_SETUP_HEADER)
  if (index === -1) return trimmed

  return trimmed.slice(0, index).trimEnd()
}

export function replyContainsIrisSetupBlock(text: string): boolean {
  return text.includes(SIGNAL_SETUP_HEADER)
}
