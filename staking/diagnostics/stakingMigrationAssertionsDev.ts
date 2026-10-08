/**
 * DEV-only deprecated import-path audit helpers.
 * Production: no-op.
 */

export type DeprecatedLibStakingShimSpec = Readonly<{
  from: string
  canonical: string
}>

const warnedShimImports = new Set<string>()

export function devWarnDeprecatedLibStakingShimImport(
  spec: DeprecatedLibStakingShimSpec
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (warnedShimImports.has(spec.from)) return
  warnedShimImports.add(spec.from)
  console.warn(
    `[staking-migration] deprecated import path: ${spec.from}`,
    { replaceWith: spec.canonical }
  )
}
