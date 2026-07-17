/**
 * POS table-session helpers — mirrors web middleware + dining 403 handling.
 * See RESTOQUICK_DOC.md → Flow: POS dining order / Table sessions.
 */

export type ActiveSessionLookupResult =
  | { kind: 'active'; sessionId: string }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

/** Server statusMessage for dining submit / active GET when no ACTIVE session exists. */
export const NO_ACTIVE_SESSION_MESSAGE = 'No active session found for this table';

export function isNoActiveSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no active session/i.test(message);
}

/** Classify the result of verifying GET /api/table-sessions/active/{tableId}. */
export function resolveActiveSessionLookup(
  result:
    | { ok: true; session: { id: string } }
    | { ok: false; error: unknown }
): ActiveSessionLookupResult {
  if (result.ok) {
    return { kind: 'active', sessionId: result.session.id };
  }
  if (isNoActiveSessionError(result.error)) {
    return { kind: 'missing' };
  }
  const message =
    result.error instanceof Error ? result.error.message : 'Could not verify table session.';
  return { kind: 'error', message };
}

/**
 * After a live-table tap: enter order only when the session is still ACTIVE.
 * Missing session → reopen confirm (cashier may have closed it).
 */
export function resolveVerifiedTableEntry({
  tableId,
  tableNumber,
  lookup,
}: {
  tableId: string;
  tableNumber: string;
  lookup: ActiveSessionLookupResult;
}):
  | { kind: 'enter-order'; tableId: string; sessionId: string }
  | { kind: 'confirm-open-session'; tableId: string; tableNumber: string }
  | { kind: 'show-error'; message: string } {
  if (lookup.kind === 'active') {
    return { kind: 'enter-order', tableId, sessionId: lookup.sessionId };
  }
  if (lookup.kind === 'missing') {
    return { kind: 'confirm-open-session', tableId, tableNumber };
  }
  return { kind: 'show-error', message: lookup.message };
}

/** Dining submit failed because the session was closed — clear ticket and return to tables. */
export function resolveDiningSubmitSessionError(error: unknown): {
  kind: 'session-closed' | 'other';
  message: string;
} {
  if (isNoActiveSessionError(error)) {
    return {
      kind: 'session-closed',
      message: 'This table has no active session. Pick a table to reopen it.',
    };
  }
  const message = error instanceof Error ? error.message : 'Failed to send order.';
  return { kind: 'other', message };
}

export function diningCustomerName(name: string) {
  // Web hardcodes "Walk_in"; native allows an editable name with the same fallback.
  return name.trim() || 'Walk_in';
}

export function takeawayCustomerName(name: string) {
  // Mirrors web: empty → "Takeaway".
  return name.trim() || 'Takeaway';
}
