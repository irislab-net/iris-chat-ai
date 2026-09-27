/** Runtime messages between side panel, background, and login wizard. */

export const EXUR_OPEN_LOGIN = "exur:open-login" as const
export const EXUR_AUTH_SUCCESS = "exur:auth-success" as const
export const EXUR_AUTH_CANCELLED = "exur:auth-cancelled" as const
export const EXUR_LOGIN_ERROR = "exur:login-error" as const

export type ExurLoginMessage =
  | { type: typeof EXUR_OPEN_LOGIN }
  | { type: typeof EXUR_AUTH_SUCCESS }
  | { type: typeof EXUR_AUTH_CANCELLED }
  | { type: typeof EXUR_LOGIN_ERROR; error: string }

export function isExurLoginMessage(value: unknown): value is ExurLoginMessage {
  if (!value || typeof value !== "object") return false
  const type = (value as { type?: unknown }).type
  return (
    type === EXUR_OPEN_LOGIN ||
    type === EXUR_AUTH_SUCCESS ||
    type === EXUR_AUTH_CANCELLED ||
    type === EXUR_LOGIN_ERROR
  )
}
