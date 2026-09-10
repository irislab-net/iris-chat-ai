const SERVER_PREFIX = "server:"

export function serverMessageId(id: number): string {
  return `${SERVER_PREFIX}${id}`
}

export function parseServerMessageId(messageId: string): number | null {
  if (!messageId.startsWith(SERVER_PREFIX)) return null
  const raw = messageId.slice(SERVER_PREFIX.length)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
