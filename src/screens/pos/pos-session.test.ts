import { describe, expect, test } from 'bun:test';

import {
  diningCustomerName,
  isNoActiveSessionError,
  NO_ACTIVE_SESSION_MESSAGE,
  resolveActiveSessionLookup,
  resolveDiningSubmitSessionError,
  resolveVerifiedTableEntry,
  takeawayCustomerName,
} from './pos-session';

describe('isNoActiveSessionError', () => {
  test('matches the Nitro dining / active-session statusMessage', () => {
    expect(isNoActiveSessionError(new Error(NO_ACTIVE_SESSION_MESSAGE))).toBe(true);
    expect(isNoActiveSessionError(new Error('no active session found for this table'))).toBe(
      true
    );
  });

  test('rejects unrelated errors', () => {
    expect(isNoActiveSessionError(new Error('Invalid order payload'))).toBe(false);
    expect(isNoActiveSessionError(new Error('Request failed (500)'))).toBe(false);
    expect(isNoActiveSessionError('boom')).toBe(false);
  });
});

describe('resolveActiveSessionLookup', () => {
  test('returns active when the session payload has an id', () => {
    expect(
      resolveActiveSessionLookup({ ok: true, session: { id: 'session-1' } })
    ).toEqual({ kind: 'active', sessionId: 'session-1' });
  });

  test('maps 404-style no-session errors to missing', () => {
    expect(
      resolveActiveSessionLookup({
        ok: false,
        error: new Error(NO_ACTIVE_SESSION_MESSAGE),
      })
    ).toEqual({ kind: 'missing' });
  });

  test('preserves other failures as showable errors', () => {
    expect(
      resolveActiveSessionLookup({
        ok: false,
        error: new Error('Sign in again to continue.'),
      })
    ).toEqual({ kind: 'error', message: 'Sign in again to continue.' });
  });
});

describe('resolveVerifiedTableEntry', () => {
  test('enters order when the session is still ACTIVE', () => {
    expect(
      resolveVerifiedTableEntry({
        tableId: 'table-1',
        tableNumber: '4',
        lookup: { kind: 'active', sessionId: 'session-1' },
      })
    ).toEqual({
      kind: 'enter-order',
      tableId: 'table-1',
      sessionId: 'session-1',
    });
  });

  test('asks to reopen when the cached live table lost its session', () => {
    expect(
      resolveVerifiedTableEntry({
        tableId: 'table-1',
        tableNumber: '4',
        lookup: { kind: 'missing' },
      })
    ).toEqual({
      kind: 'confirm-open-session',
      tableId: 'table-1',
      tableNumber: '4',
    });
  });

  test('surfaces verify failures', () => {
    expect(
      resolveVerifiedTableEntry({
        tableId: 'table-1',
        tableNumber: '4',
        lookup: { kind: 'error', message: 'Network down' },
      })
    ).toEqual({ kind: 'show-error', message: 'Network down' });
  });
});

describe('resolveDiningSubmitSessionError', () => {
  test('recovers from 403 no-active-session on dining submit', () => {
    expect(resolveDiningSubmitSessionError(new Error(NO_ACTIVE_SESSION_MESSAGE))).toEqual({
      kind: 'session-closed',
      message: 'This table has no active session. Pick a table to reopen it.',
    });
  });

  test('leaves other submit failures alone', () => {
    expect(resolveDiningSubmitSessionError(new Error('Invalid order payload'))).toEqual({
      kind: 'other',
      message: 'Invalid order payload',
    });
  });
});

describe('customer name defaults (web parity)', () => {
  test('dining falls back to Walk_in', () => {
    expect(diningCustomerName('Alex')).toBe('Alex');
    expect(diningCustomerName('  ')).toBe('Walk_in');
    expect(diningCustomerName('')).toBe('Walk_in');
  });

  test('takeaway falls back to Takeaway', () => {
    expect(takeawayCustomerName('Sam')).toBe('Sam');
    expect(takeawayCustomerName('')).toBe('Takeaway');
    expect(takeawayCustomerName('   ')).toBe('Takeaway');
  });
});

describe('session journey decisions', () => {
  test('stale live table → missing lookup → reopen confirm → open → enter', () => {
    const stale = resolveVerifiedTableEntry({
      tableId: 'table-free',
      tableNumber: '7',
      lookup: { kind: 'missing' },
    });
    expect(stale.kind).toBe('confirm-open-session');

    const afterCreate = resolveVerifiedTableEntry({
      tableId: 'table-free',
      tableNumber: '7',
      lookup: { kind: 'active', sessionId: 'session-new' },
    });
    expect(afterCreate).toEqual({
      kind: 'enter-order',
      tableId: 'table-free',
      sessionId: 'session-new',
    });
  });

  test('submit after cashier closes session → session-closed recovery', () => {
    const recovery = resolveDiningSubmitSessionError(
      new Error('No active session found for this table')
    );
    expect(recovery.kind).toBe('session-closed');
    expect(recovery.message).toContain('Pick a table to reopen');
  });
});
