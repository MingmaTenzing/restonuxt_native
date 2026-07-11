import { describe, expect, test } from 'bun:test';

import { websocketUrl } from './websocket-url';

describe('websocketUrl', () => {
  test('converts https API base to wss', () => {
    expect(websocketUrl('/api/websocket')).toBe(
      'wss://restoquicknuxt-production.up.railway.app/api/websocket',
    );
  });

  test('normalizes paths without a leading slash', () => {
    expect(websocketUrl('api/websocket')).toBe(
      'wss://restoquicknuxt-production.up.railway.app/api/websocket',
    );
  });
});
