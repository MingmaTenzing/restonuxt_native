import { describe, expect, test } from 'bun:test';

import { mapPosTables, pickActiveSessionId } from './pos-tables';
import { partitionTablesBySession, tableHasLiveSession } from './pos-flow';

describe('pickActiveSessionId', () => {
  test('prefers explicit ACTIVE', () => {
    expect(
      pickActiveSessionId([
        { id: 'closed', status: 'CLOSED' },
        { id: 'active', status: 'ACTIVE' },
      ])
    ).toBe('active');
  });

  test('accepts production rows without status', () => {
    expect(pickActiveSessionId([{ id: 's1' }])).toBe('s1');
  });

  test('rejects CLOSED-only lists', () => {
    expect(pickActiveSessionId([{ id: 's1', status: 'CLOSED' }])).toBeNull();
  });
});

describe('mapPosTables', () => {
  test('prefers ACTIVE session over first session', () => {
    const result = mapPosTables([
      {
        id: 't1',
        number: '2',
        capacity: 4,
        sessions: [
          { id: 'closed-1', status: 'CLOSED' },
          { id: 'active-1', status: 'ACTIVE' },
        ],
      },
    ]);

    expect(result[0]?.activeSessionId).toBe('active-1');
  });

  test('ignores CLOSED / non-ACTIVE sessions (not live)', () => {
    // GET /api/tables never returns CLOSED rows; if a mock does, the table must stay free.
    const result = mapPosTables([
      {
        id: 't1',
        number: '1',
        capacity: 2,
        sessions: [{ id: 'only-1', status: 'CLOSED' }],
      },
    ]);

    expect(result[0]?.activeSessionId).toBeNull();
  });

  test('returns null activeSessionId when no sessions (free table)', () => {
    const result = mapPosTables([
      { id: 't1', number: '3', capacity: 6, sessions: [] },
    ]);

    expect(result[0]?.activeSessionId).toBeNull();
    expect(tableHasLiveSession(result[0]!)).toBe(false);
  });

  test('treats omitted sessions as free', () => {
    const result = mapPosTables([{ id: 't1', number: '5', capacity: 4 }]);
    expect(result[0]?.activeSessionId).toBeNull();
  });

  test('maps production-shaped ACTIVE-only sessions as live', () => {
    // Mirrors GET /api/tables: sessions array only contains ACTIVE rows (no status field required).
    const result = mapPosTables([
      {
        id: 't1',
        number: '8',
        capacity: 4,
        sessions: [{ id: 'active-only' }],
      },
    ]);

    expect(result[0]?.activeSessionId).toBe('active-only');
    expect(tableHasLiveSession(result[0]!)).toBe(true);
  });

  test('sorts tables numerically by number', () => {
    const result = mapPosTables([
      { id: 't3', number: '10', capacity: 4 },
      { id: 't1', number: '2', capacity: 4 },
      { id: 't2', number: '1', capacity: 4 },
    ]);

    expect(result.map((table) => table.number)).toEqual(['1', '2', '10']);
  });

  test('preserves capacity and id while mapping session state', () => {
    const result = mapPosTables([
      {
        id: 'table-uuid',
        number: '12',
        capacity: 8,
        sessions: [{ id: 'sess-a', status: 'ACTIVE' }],
      },
    ]);

    expect(result[0]).toEqual({
      id: 'table-uuid',
      number: '12',
      capacity: 8,
      activeSessionId: 'sess-a',
    });
  });

  test('maps a mixed floor into live and free partitions', () => {
    const mapped = mapPosTables([
      { id: 't-free', number: '1', capacity: 2, sessions: [] },
      {
        id: 't-live',
        number: '2',
        capacity: 4,
        sessions: [{ id: 's1', status: 'ACTIVE' }],
      },
      { id: 't-also-free', number: '3', capacity: 2 },
    ]);

    expect(partitionTablesBySession(mapped)).toEqual({
      live: [
        {
          id: 't-live',
          number: '2',
          capacity: 4,
          activeSessionId: 's1',
        },
      ],
      free: [
        {
          id: 't-free',
          number: '1',
          capacity: 2,
          activeSessionId: null,
        },
        {
          id: 't-also-free',
          number: '3',
          capacity: 2,
          activeSessionId: null,
        },
      ],
    });
  });
});
