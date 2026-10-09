declare const stakingRuntimeGenerationBrand: unique symbol

/**
 * Phase 26 — **immutable runtime generation** for invalidating async work across runtime transitions.
 *
 * Today this is a **static constant** (no increment APIs, no mutable selection). When staking can
 * switch runtimes, the same **`runtimeKey`** may appear across transitions; **`generation`** disambiguates
 * snapshots so effects / inflight work can key on **`runtimeKey` + `generation`** instead of key alone.
 *
 * Branded to avoid accidental mixing with chain ids, block numbers, or hook “generation” counters.
 */
export type RuntimeGeneration = number & { readonly [stakingRuntimeGenerationBrand]: true }

/** Passive single-runtime app — bumps when mutable runtime selection lands (future phase). Phase 28: feeds **`RuntimeTransitionSnapshot.executionIdentity`**. */
export const STAKING_RUNTIME_GENERATION_INITIAL: RuntimeGeneration = 1 as RuntimeGeneration

export function createStaticRuntimeGeneration(): RuntimeGeneration {
  return STAKING_RUNTIME_GENERATION_INITIAL
}

/** Phase 34 — monotonic bump for in-memory runtime swaps (invalidates async keyed on generation). */
export function bumpRuntimeGeneration(g: RuntimeGeneration): RuntimeGeneration {
  return (g + 1) as RuntimeGeneration
}
