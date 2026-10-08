import { DEBUG_LOGS } from "@/config/env"

/**
 * Local dev console diagnostics (`(process.env.NODE_ENV !== 'production')` + `VITE_DEBUG_LOGS`).
 * Production bundles tree-shake `DEV` branches; leave `VITE_DEBUG_LOGS` unset/false in prod env.
 */
export function isDevConsoleLoggingEnabled(): boolean {
  return (process.env.NODE_ENV !== 'production') && DEBUG_LOGS
}

/**
 * `log` / `warn` are no-ops unless dev console logging is enabled.
 * `error` always reaches the console for real failures.
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDevConsoleLoggingEnabled()) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDevConsoleLoggingEnabled()) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    console.error(...args)
  },
}
