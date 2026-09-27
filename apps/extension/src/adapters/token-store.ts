import type { TokenStore } from "@exur/api-client"

const ACCESS_KEY = "exur_ext_access_token"
const EXPIRES_KEY = "exur_ext_expires_at"
const REFRESH_KEY = "exur_ext_refresh_token"
const GUEST_TOKEN_KEY = "exur_ext_guest_token"
const GUEST_USER_KEY = "exur_ext_guest_user_id"

async function storageGet(keys: string[]): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result as Record<string, string>)
    })
  })
}

async function storageSet(values: Record<string, string>) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.set(values, () => resolve())
  })
}

async function storageRemove(keys: string[]) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.remove(keys, () => resolve())
  })
}

export const chromeTokenStore: TokenStore = {
  async getAccessToken() {
    const data = await storageGet([ACCESS_KEY])
    return data[ACCESS_KEY] ?? null
  },
  async setAccessToken(token, expiresAt) {
    await storageSet({ [ACCESS_KEY]: token, [EXPIRES_KEY]: expiresAt })
  },
  async clearAccessToken() {
    await storageRemove([ACCESS_KEY, EXPIRES_KEY, REFRESH_KEY])
  },
  async getGuestToken() {
    const data = await storageGet([GUEST_TOKEN_KEY])
    return data[GUEST_TOKEN_KEY] ?? null
  },
  async setGuestToken(token, userId) {
    await storageSet({
      [GUEST_TOKEN_KEY]: token,
      [GUEST_USER_KEY]: userId,
    })
  },
  async clearGuestToken() {
    await storageRemove([GUEST_TOKEN_KEY, GUEST_USER_KEY])
  },
}

export async function getStoredRefreshToken(): Promise<string | null> {
  const data = await storageGet([REFRESH_KEY])
  return data[REFRESH_KEY] ?? null
}

export async function storeRefreshToken(token: string) {
  await storageSet({ [REFRESH_KEY]: token })
}

export async function storeAuthTokens(input: {
  access_token: string
  expires_at: string
  refresh_token?: string
}) {
  await chromeTokenStore.setAccessToken(input.access_token, input.expires_at)
  if (input.refresh_token) {
    await storeRefreshToken(input.refresh_token)
  }
}
