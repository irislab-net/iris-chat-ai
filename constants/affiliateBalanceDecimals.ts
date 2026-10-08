/**
 * Firestore / affiliate **cost basis** (`base_balance`) uses a fixed 6-decimal
 * representation. Only the affiliate base-balance pipeline may use this scale;
 * on-chain amounts use `decimals()` from the ERC-20 / vault.
 */
export const AFFILIATE_BALANCE_DECIMALS = 6 as const
