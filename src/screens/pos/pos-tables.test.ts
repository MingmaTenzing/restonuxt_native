import { describe, expect, test } from 'bun:test';

import { mapPosTables } from './pos-tables';

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

  test('falls back to first session when none are ACTIVE', () => {
    const result = mapPosTables([
      {
        id: 't1',
        number: '1',
        capacity: 2,
        sessions: [{ id: 'only-1', status: 'CLOSED' }],
      },
    ]);

    expect(result[0]?.activeSessionId).toBe('only-1');
  });

  test('returns null activeSessionId when no sessions', () => {
    const result = mapPosTables([
      { id: 't1', number: '3', capacity: 6, sessions: [] },
    ]);

    expect(result[0]?.activeSessionId).toBeNull();
  });

  test('sorts tables numerically by number', () => {
    const result = mapPosTables([
      { id: 't3', number: '10', capacity: 4 },
      { id: 't1', number: '2', capacity: 4 },
      { id: 't2', number: '1', capacity: 4 },
    ]);

    expect(result.map((table) => table.number)).toEqual(['1', '2', '10']);
  });
});
