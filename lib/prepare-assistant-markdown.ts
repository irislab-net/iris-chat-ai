import { prepareAssistantMarkdown } from "@/lib/chat/normalize-assistant-content"

export {
  normalizeAssistantContent,
  prepareAssistantMarkdown,
  CODE_LANG_KEEP,
} from "@/lib/chat/normalize-assistant-content"
export type { NormalizeResult } from "@/lib/chat/normalize-assistant-content"

/** Back-compat default for older imports. */
export default prepareAssistantMarkdown
