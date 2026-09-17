type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
  client_id?: string
}

type GooglePromptMomentNotification = {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () =>
    | "browser_not_supported"
    | "invalid_client"
    | "missing_client_id"
    | "opt_out_or_no_session"
    | "secure_http_required"
    | "suppressed_by_user"
    | "unregistered_origin"
    | "unknown_reason"
  isSkippedMoment: () => boolean
  getSkippedReason: () =>
    | "auto_cancel"
    | "user_cancel"
    | "tap_outside"
    | "issuing_failed"
  isDismissedMoment: () => boolean
  getDismissedReason: () => "credential_returned" | "cancel_called" | "flow_restarted"
}

type GoogleIdConfiguration = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  color_scheme?: "light" | "dark"
  context?: "signin" | "signup" | "use"
  itp_support?: boolean
  use_fedcm_for_prompt?: boolean
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void
        prompt: (
          momentListener?: (notification: GooglePromptMomentNotification) => void
        ) => void
        cancel: () => void
        disableAutoSelect: () => void
      }
    }
  }
}
