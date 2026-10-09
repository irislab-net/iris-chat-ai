/**
 * Staking package boundary rules (Phase S1).
 * DEV assertions + ESLint `no-restricted-imports` patterns — production: types only.
 */

export type StakingPackageId =
  | "core"
  | "runtime"
  | "execution"
  | "tx"
  | "refresh"
  | "orchestration"
  | "history"
  | "identity"
  | "vault"
  | "ui"
  | "notifications"
  | "cta"
  | "diagnostics"
  | "reads"
  | "selectors"
  | "profit"
  | "integrations"
  | "affiliate"
  | "dev"

export type StakingBoundaryViolationKind =
  | "forbidden_import_prefix"
  | "forbidden_import_glob"
  | "package_must_not_import"

export type StakingBoundaryRule = Readonly<{
  id: string
  owner: StakingPackageId
  kind: StakingBoundaryViolationKind
  /** Importer path must include this segment (e.g. `/staking/runtime/`). */
  importerPathIncludes: string
  forbidden: readonly string[]
  message: string
}>

/** Canonical dependency direction: lower layers must not import UI / components / vault composition. */
export const STAKING_BOUNDARY_RULES: readonly StakingBoundaryRule[] = [
  {
    id: "runtime-no-ui",
    owner: "runtime",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/runtime/",
    forbidden: ["@/components/", "@/staking/ui", "@/staking/vault/composer"],
    message: "staking/runtime must not import UI, components, or vault composer",
  },
  {
    id: "execution-no-components",
    owner: "execution",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/execution/",
    forbidden: ["@/components/", "@/staking/ui"],
    message: "staking/execution must not import components or presentation UI",
  },
  {
    id: "tx-no-presentation",
    owner: "tx",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/tx/",
    forbidden: [
      "@/components/pages/staking",
      "@/staking/ui",
      "@/staking/refresh/",
    ],
    message:
      "staking/tx must not import presentation components or refresh internals (use @/staking/tx/types; callbacks from composer)",
  },
  {
    id: "refresh-no-ui",
    owner: "refresh",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/refresh/",
    forbidden: ["@/components/", "@/staking/ui", "@/staking/runtime/network"],
    message:
      "staking/refresh must not import UI, components, or network glue (orchestrator-only plane; G4d)",
  },
  {
    id: "history-no-ui",
    owner: "history",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/history/",
    forbidden: ["@/components/", "@/staking/ui", "@/staking/runtime/network"],
    message:
      "staking/history must not import UI, components, or network glue (history-only plane; G4d)",
  },
  {
    id: "orchestration-no-ui",
    owner: "orchestration",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/orchestration/",
    forbidden: ["@/components/", "@/staking/ui"],
    message: "staking/orchestration must not import UI or components",
  },
  {
    id: "vault-composition-only",
    owner: "vault",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/vault/composer/",
    forbidden: ["@/components/pages/staking/TransactionStatus"],
    message: "staking/vault/composer wires planes only — no modal/provider surfaces",
  },
  {
    id: "ui-presentation-only",
    owner: "ui",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/ui/",
    forbidden: ["@/staking/vault/composer", "@/staking/refresh/stakingRefreshOrchestrator"],
    message: "staking/ui is presentation helpers only — no vault composer or orchestrator internals",
  },
  {
    id: "tree-no-lib-staking",
    owner: "core",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/",
    forbidden: ["@/lib/staking/"],
    message: "src/staking/* must not import deleted @/lib/staking/* shims",
  },
  {
    id: "tree-no-lib-tron",
    owner: "core",
    kind: "forbidden_import_prefix",
    importerPathIncludes: "/staking/",
    forbidden: ["@/lib/tron/"],
    message: "src/staking/* must import Tron from @/staking/identity/tron or @/staking/history/tron",
  },
] as const

/** Patterns for `eslint.config.js` `no-restricted-imports` (subset — highest signal). */
export const STAKING_ESLINT_BOUNDARY_PATTERNS: readonly Readonly<{
  files: string[]
  patterns: readonly { group: string[]; message: string }[]
}>[] = [
  {
    files: ["src/staking/runtime/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/components/*", "@/staking/ui", "@/staking/vault/composer"],
        message: STAKING_BOUNDARY_RULES.find(r => r.id === "runtime-no-ui")!.message,
      },
    ],
  },
  {
    files: ["src/staking/execution/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/components/*", "@/staking/ui"],
        message: STAKING_BOUNDARY_RULES.find(r => r.id === "execution-no-components")!.message,
      },
    ],
  },
  {
    files: ["src/staking/tx/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/components/pages/staking/*", "@/staking/ui", "@/staking/refresh/*"],
        message: STAKING_BOUNDARY_RULES.find(r => r.id === "tx-no-presentation")!.message,
      },
    ],
  },
  {
    files: ["src/staking/refresh/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/components/*", "@/staking/ui"],
        message: "staking/refresh must not import UI or components",
      },
      {
        group: ["@/staking/runtime/network", "@/staking/runtime/network/*"],
        message: STAKING_BOUNDARY_RULES.find(r => r.id === "refresh-no-ui")!.message,
      },
    ],
  },
  {
    files: ["src/staking/history/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/components/*", "@/staking/ui"],
        message: "staking/history must not import UI or components",
      },
      {
        group: ["@/staking/runtime/network", "@/staking/runtime/network/*"],
        message: STAKING_BOUNDARY_RULES.find(r => r.id === "history-no-ui")!.message,
      },
    ],
  },
  {
    files: ["src/staking/**/*.{ts,tsx}"],
    patterns: [
      {
        group: ["@/lib/staking/*", "@/lib/tron/*"],
        message: "Use canonical @/staking/* paths (lib shims removed in G4)",
      },
    ],
  },
] as const

const warnedBoundaryKeys = new Set<string>()

export function devAssertStakingImportBoundary(
  importSpecifier: string,
  importerLabel: string
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  for (const rule of STAKING_BOUNDARY_RULES) {
    if (!importerLabel.includes(rule.importerPathIncludes.replace(/\//g, "/"))) {
      continue
    }
    for (const forbidden of rule.forbidden) {
      if (!importSpecifier.includes(forbidden.replace(/\*/g, ""))) continue
      const key = `${rule.id}|${importSpecifier}|${importerLabel}`
      if (warnedBoundaryKeys.has(key)) return
      warnedBoundaryKeys.add(key)
      console.warn(`[staking-boundary] ${rule.message}`, {
        ruleId: rule.id,
        importSpecifier,
        importerLabel,
      })
    }
  }
}

/** Call from package barrels in DEV to register expected ownership (smoke / docs). */
const registeredOwners = new Set<StakingPackageId>()

export function devRegisterStakingPackageOwner(owner: StakingPackageId): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  registeredOwners.add(owner)
}

export function devGetRegisteredStakingPackageOwners(): readonly StakingPackageId[] {
  return [...registeredOwners]
}
