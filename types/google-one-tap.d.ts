type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
  client_id?: string
}

/**
 * Prompt moment notifications under FedCM.
 * Display/skip reason methods are removed by GIS when FedCM is enabled;
 * only dismissed-moment APIs remain reliable.
 * @see https://developers.google.com/identity/gsi/web/guides/fedcm-migration
 */
type GooglePromptMomentNotification = {
  /** @deprecated Not returned under FedCM. */
  isDisplayMoment?: () => boolean
  /** @deprecated Not returned under FedCM. */
  isDisplayed?: () => boolean
  /** @deprecated Not returned under FedCM. */
  isNotDisplayed?: () => boolean
  /** @deprecated Not returned under FedCM. */
  getNotDisplayedReason?: () =>
    | "browser_not_supported"
    | "invalid_client"
    | "missing_client_id"
    | "opt_out_or_no_session"
    | "secure_http_required"
    | "suppressed_by_user"
    | "unregistered_origin"
    | "unknown_reason"
  /** May still fire under FedCM, but without a detailed reason. */
  isSkippedMoment?: () => boolean
  /** @deprecated Detailed skip reasons are not provided under FedCM. */
  getSkippedReason?: () =>
    | "auto_cancel"
    | "user_cancel"
    | "tap_outside"
    | "issuing_failed"
  isDismissedMoment?: () => boolean
  getDismissedReason?: () =>
    | "credential_returned"
    | "cancel_called"
    | "flow_restarted"
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
