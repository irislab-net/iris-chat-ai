/**
 * Receipt success → Sonner ownership (Phase 1 notification normalization).
 *
 * Modal owns in-flow success UI; continuation toast only when the modal is not
 * surfacing this receipt. Dedupe is enforced separately via `receiptSuccessToastShownRef` + `dedupeId`.
 */
export function shouldEmitReceiptSuccessSonnerToast(args: {
  /** Same-hash success already recorded (modal or continuation path). */
  receiptSuccessAlreadyAcknowledgedForHash: boolean
  /**
   * The transaction modal is open and is the surface for this successful receipt
   * (confirmed transition, or already showing confirmed/success for this hash).
   */
  modalSurfacesReceiptSuccess: boolean
}): boolean {
  if (args.receiptSuccessAlreadyAcknowledgedForHash) return false
  if (args.modalSurfacesReceiptSuccess) return false
  return true
}
