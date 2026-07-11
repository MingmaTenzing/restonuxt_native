import { describe, expect, test } from 'bun:test';

import { parseKitchenWebSocketMessage } from './types';

describe('parseKitchenWebSocketMessage', () => {
  test('parses valid kitchen events', () => {
    const raw = JSON.stringify({
      type: 'ORDER_CREATED',
      payload: { id: 'order-1', orderNo: 1 },
    });

    expect(parseKitchenWebSocketMessage(raw)).toEqual({
      type: 'ORDER_CREATED',
      payload: { id: 'order-1', orderNo: 1 },
    });
  });

  test('ignores pong heartbeat frames', () => {
    expect(parseKitchenWebSocketMessage('pong')).toBeNull();
  });

  test('rejects unknown event types', () => {
    expect(parseKitchenWebSocketMessage(JSON.stringify({ type: 'MENU_UPDATED', payload: {} }))).toBeNull();
  });

  test('rejects malformed JSON under stress without throwing', () => {
    const garbage = ['{', 'not-json', '', '{"type":"BROKEN"', '{"type":"ORDER_CREATED","payload":'];

    for (const raw of garbage) {
      expect(() => parseKitchenWebSocketMessage(raw)).not.toThrow();
      expect(parseKitchenWebSocketMessage(raw)).toBeNull();
    }
  });

  test('parses 10_000 mixed valid and invalid frames', () => {
    let parsed = 0;

    for (let i = 0; i < 10_000; i += 1) {
      const raw =
        i % 3 === 0
          ? 'pong'
          : i % 5 === 0
            ? '{bad-json'
            : JSON.stringify({
                type: i % 2 === 0 ? 'ORDER_CREATED' : 'ORDER_MARKED_COMPLETED',
                payload: { id: `order-${i}`, orderNo: i },
              });

      const message = parseKitchenWebSocketMessage(raw);
      if (message) parsed += 1;
    }

    expect(parsed).toBeGreaterThan(3_000);
  });
});
