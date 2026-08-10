/** CTA on the floating mobile balance bar. */
export function checkoutBalanceBarActionLabel(isPaid: boolean) {
  return isPaid ? 'Receipt & actions' : 'Collect payment';
}

/** Sheet header title for collect vs paid/reprint flows. */
export function checkoutPaymentSheetTitle(isPaid: boolean) {
  return isPaid ? 'Receipt' : 'Collect payment';
}

export function canShowUndoPaid(isPaid: boolean) {
  return isPaid;
}

export type UndoTablePaidDecision =
  | { kind: 'allow'; tableSessionId: string }
  | { kind: 'blocked-not-paid'; tableSessionId: string };

/**
 * Undo payment for a table session by session id.
 * Does not reopen the session — orders become unpaid on the same closed session
 * so a different ACTIVE session can still take new orders on that table.
 */
export function resolveUndoTablePaid({
  tableSessionId,
  isPaid,
}: {
  tableSessionId: string;
  isPaid: boolean;
}): UndoTablePaidDecision {
  if (!isPaid) {
    return { kind: 'blocked-not-paid', tableSessionId };
  }
  return { kind: 'allow', tableSessionId };
}

export function formatUndoTablePaidBlockMessage(decision: UndoTablePaidDecision) {
  if (decision.kind === 'allow') return null;
  return 'This sale is not paid, so there is nothing to undo.';
}

export type UndoTakeawayPaidDecision =
  | { kind: 'allow'; orderId: string }
  | { kind: 'blocked-not-paid'; orderId: string };

export function resolveUndoTakeawayPaid({
  orderId,
  isPaid,
}: {
  orderId: string;
  isPaid: boolean;
}): UndoTakeawayPaidDecision {
  if (!isPaid) {
    return { kind: 'blocked-not-paid', orderId };
  }
  return { kind: 'allow', orderId };
}

export function formatUndoTakeawayPaidBlockMessage(decision: UndoTakeawayPaidDecision) {
  if (decision.kind === 'allow') return null;
  return 'This takeaway order is not paid, so there is nothing to undo.';
}

/** Confirm copy for the undo alert. */
export function undoPaidConfirmMessage(kind: 'table' | 'takeaway') {
  if (kind === 'table') {
    return 'This marks the orders unpaid so you can collect again. The session stays closed, so new orders on this table use a separate session.';
  }
  return 'This marks the takeaway order unpaid and returns it to the cashier queue. Only continue if payment was recorded by mistake.';
}
