/**
 * Receipt / tx-modal error → Sonner ownership (Phase 2 notification normalization).
 *
 * Modal owns in-flow failure UI; continuation toast only when the modal is not
 * surfacing this hash's failure. Hash dedupe is enforced separately via ref + `dedupeId`.
 */
export function shouldEmitReceiptErrorSonnerToast(args: {
  /** Same-hash error toast/modal ack already recorded. */
  receiptErrorAlreadyAcknowledgedForHash: boolean
  /** The transaction modal is open and shows this receipt failure. */
  modalSurfacesReceiptError: boolean
}): boolean {
  if (args.receiptErrorAlreadyAcknowledgedForHash) return false
  if (args.modalSurfacesReceiptError) return false
  return true
}
