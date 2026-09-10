export type {
  CreateWalletChallengeRequest,
  CreateWalletChallengeResponse,
  ListLinkedWalletsResponse,
  UnlinkWalletResponse,
  VerifyWalletSignatureRequest,
  VerifyWalletSignatureResponse,
  WalletAuditEvent,
  WalletAuditEventType,
  WalletChallenge,
  WalletIdentity,
  WalletLifecycleState,
  WalletVerificationFailureReason,
  WalletVerificationResult,
} from "@/lib/wallet/types"

export {
  normalizeWalletAddress,
  isValidWalletAddress,
  WalletAddressError,
} from "@/lib/wallet/address"

export {
  buildWalletChallengeMessage,
  createWalletChallenge,
  InMemoryChallengeStore,
  linkVerifiedWalletIdentity,
  markWalletChanged,
  revokeWalletIdentity,
  verifyWalletChallenge,
  type ChallengeStore,
} from "@/lib/wallet/challenge"

export {
  HmacWalletSignatureVerifier,
  signTestWalletMessage,
  UnavailableWalletSignatureVerifier,
  type WalletSignatureInput,
  type WalletSignatureVerifier,
} from "@/lib/wallet/signature"

export {
  primaryWalletIdentity,
  verifiedWalletAddress,
  walletLifecycleFromIdentity,
  walletReadinessStatus,
  type WalletReadinessStatus,
} from "@/lib/wallet/identity"

export {
  createWalletChallenge as createWalletChallengeRemote,
  listLinkedWallets,
  unlinkWallet,
  verifyWalletSignature as verifyWalletSignatureRemote,
} from "@/lib/wallet/service"
