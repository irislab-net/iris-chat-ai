import {
  EXUR_OPEN_LOGIN,
  isExurLoginMessage,
} from "@/adapters/login-messages"

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("sidePanel behavior", error))

async function openLoginWizard() {
  const url = chrome.runtime.getURL("login.html")

  // Reuse an existing login tab if one is already open.
  const existing = await chrome.tabs.query({ url })
  const tab = existing[0]
  if (tab?.id != null) {
    await chrome.tabs.update(tab.id, { active: true })
    if (tab.windowId != null) {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
    return
  }

  await chrome.tabs.create({ url, active: true })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExurLoginMessage(message)) return

  if (message.type === EXUR_OPEN_LOGIN) {
    void openLoginWizard()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("open login wizard", error)
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      })
    return true
  }

  // Auth success / cancel / error are rebroadcast automatically to other
  // extension pages that listen on chrome.runtime.onMessage.
  return false
})
