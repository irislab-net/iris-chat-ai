/**
 * User-facing auth copy for the extension.
 * Technical details stay in console / thrown raw messages for developers only.
 */

export type AuthUserError = {
  title: string
  description: string
}

export function toAuthUserError(raw: unknown): AuthUserError {
  const message = raw instanceof Error ? raw.message : String(raw ?? "")

  if (/cancel/i.test(message)) {
    return {
      title: "Sign-in cancelled",
      description: "You can try again whenever you’re ready.",
    }
  }

  if (
    /redirect|chromiumapp|did not approve|id_token|mismatch|oauth/i.test(
      message
    )
  ) {
    return {
      title: "Sign-in isn’t available right now",
      description:
        "Please try again in a moment. If it keeps failing, reload Exur and try once more.",
    }
  }

  if (/Client ID|VITE_GOOGLE/i.test(message)) {
    return {
      title: "Sign-in isn’t available right now",
      description: "Please reload Exur and try again.",
    }
  }

  if (/CORS|Failed to fetch|NetworkError|Load failed|network/i.test(message)) {
    return {
      title: "Connection problem",
      description: "Check your internet connection, then try again.",
    }
  }

  return {
    title: "Couldn’t sign in",
    description: "Something went wrong. Please try again.",
  }
}
