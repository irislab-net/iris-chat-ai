import { isDevConsoleLoggingEnabled } from "@/lib/logger"

export { isDevConsoleLoggingEnabled }

export function stakingDevConsoleDebug(...args: unknown[]): void {
  if (!isDevConsoleLoggingEnabled()) return
  console.debug(...args)
}

export function stakingDevConsoleInfo(...args: unknown[]): void {
  if (!isDevConsoleLoggingEnabled()) return
  console.info(...args)
}

export function stakingDevConsoleWarn(...args: unknown[]): void {
  if (!isDevConsoleLoggingEnabled()) return
  console.warn(...args)
}

export function stakingDevConsoleLog(...args: unknown[]): void {
  if (!isDevConsoleLoggingEnabled()) return
  console.log(...args)
}
