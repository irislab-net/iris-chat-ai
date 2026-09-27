/** Registered user id when signed in; null means guest chat auth. */
let registeredUserId: string | null = null

export function setChatRegisteredUserId(userId: string | null) {
  registeredUserId = userId?.trim() ? userId : null
}

export function isGuestChatSession(): boolean {
  return registeredUserId == null
}
