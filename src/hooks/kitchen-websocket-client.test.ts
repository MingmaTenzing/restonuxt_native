import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';

import {
  buildKitchenWebSocketUrl,
  INITIAL_RECONNECT_MS,
  KitchenWebSocketClient,
  MAX_RECONNECT_MS,
  nextReconnectDelay,
  PING_INTERVAL_MS,
  PONG_TIMEOUT_MS,
} from './kitchen-websocket-client';
import { kitchenEvent, makeOrder } from '@/test/kitchen-fixtures';
import { installMockWebSocket, MockWebSocket } from '@/test/mock-websocket';

function createTrackedSocket(registry: MockWebSocket[]) {
  return (url: string) => {
    const socket = new MockWebSocket(url);
    registry.push(socket);
    queueMicrotask(() => socket.simulateOpen());
    return socket as unknown as WebSocket;
  };
}

function flushMicrotasks() {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
}

describe('kitchen websocket client', () => {
  let mockSockets: ReturnType<typeof installMockWebSocket>;

  beforeEach(() => {
    mockSockets = installMockWebSocket();
  });

  afterEach(() => {
    mockSockets.reset();
  });

  test('nextReconnectDelay caps backoff and adds jitter', () => {
    expect(nextReconnectDelay(0, () => 0)).toBe(INITIAL_RECONNECT_MS);
    expect(nextReconnectDelay(20, () => 0)).toBe(MAX_RECONNECT_MS);
    expect(nextReconnectDelay(0, () => 0.99)).toBe(INITIAL_RECONNECT_MS + 495);
  });

  test('buildKitchenWebSocketUrl appends token on web only', () => {
    expect(buildKitchenWebSocketUrl('token-123', 'web')).toContain('token=token-123');
    expect(buildKitchenWebSocketUrl('token-123', 'native')).not.toContain('token=');
    expect(buildKitchenWebSocketUrl('token-123', 'native')).toContain('/api/websocket');
  });

  test('connects and delivers 10_000 kitchen events', async () => {
    const messages: string[] = [];
    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: (message) => messages.push(message.type),
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    const socket = mockSockets.latest;
    expect(socket?.url).toContain('/api/websocket');
    expect(client.connectionState).toBe('connected');

    for (let i = 0; i < 10_000; i += 1) {
      const order = makeOrder({ id: `order-${i}`, orderNo: i });
      socket?.simulateMessage(JSON.stringify(kitchenEvent('ORDER_CREATED', order)));
      if (i % 50 === 0) {
        socket?.simulateMessage('pong');
      }
    }

    expect(messages).toHaveLength(10_000);
    client.stop();
  });

  test('ignores stale socket close events during rapid reconnects', async () => {
    const states: string[] = [];
    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {},
      onStateChange: (state) => states.push(state),
      random: () => 0,
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    const first = mockSockets.sockets[0];

    client.reconnect();
    await flushMicrotasks();

    const second = mockSockets.sockets[1];
    first?.close();

    expect(mockSockets.sockets.length).toBeGreaterThanOrEqual(2);
    expect(client.connectionState).toBe('connected');
    expect(second?.readyState).toBe(MockWebSocket.OPEN);

    client.stop();
    expect(states.at(-1)).toBe('disconnected');
  });

  test('retries when token is missing then recovers', async () => {
    jest.useFakeTimers();

    let tokenAvailable = false;
    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => (tokenAvailable ? 'kitchen-token' : null),
      onMessage: () => {},
      random: () => 0,
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();
    expect(mockSockets.sockets).toHaveLength(0);
    expect(client.connectionState).toBe('reconnecting');

    tokenAvailable = true;
    jest.advanceTimersByTime(INITIAL_RECONNECT_MS);
    await flushMicrotasks();

    expect(mockSockets.sockets.length).toBeGreaterThan(0);
    expect(client.connectionState).toBe('connected');

    client.stop();
    jest.useRealTimers();
  });

  test('heartbeat sends ping and tolerates pong under message flood', async () => {
    jest.useFakeTimers();

    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {},
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    const socket = mockSockets.latest;
    expect(socket).not.toBeNull();

    for (let i = 0; i < 1_000; i += 1) {
      socket?.simulateMessage(
        JSON.stringify(
          kitchenEvent('ORDER_CREATED', makeOrder({ id: `o-${i}`, orderNo: i })),
        ),
      );
    }

    jest.advanceTimersByTime(PING_INTERVAL_MS);
    expect(socket?.sent.at(-1)).toBe('ping');

    socket?.simulateMessage('pong');
    jest.advanceTimersByTime(PING_INTERVAL_MS);
    expect(socket?.readyState).toBe(MockWebSocket.OPEN);

    client.stop();
    jest.useRealTimers();
  });

  test('closes and schedules reconnect when pong is missing', async () => {
    jest.useFakeTimers();

    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {},
      random: () => 0,
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    const first = mockSockets.latest;
    jest.advanceTimersByTime(PING_INTERVAL_MS);
    expect(first?.sent).toContain('ping');

    jest.advanceTimersByTime(PONG_TIMEOUT_MS);
    await flushMicrotasks();

    expect(first?.readyState).toBe(MockWebSocket.CLOSED);
    expect(client.connectionState).toBe('reconnecting');

    jest.advanceTimersByTime(INITIAL_RECONNECT_MS);
    await flushMicrotasks();

    expect(mockSockets.sockets.length).toBeGreaterThan(1);
    expect(client.connectionState).toBe('connected');

    client.stop();
    jest.useRealTimers();
  });

  test('survives 300 forced disconnect cycles', async () => {
    jest.useFakeTimers();

    let delivered = 0;
    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {
        delivered += 1;
      },
      random: () => 0,
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    for (let cycle = 0; cycle < 300; cycle += 1) {
      const socket = mockSockets.latest;
      socket?.simulateMessage(
        JSON.stringify(
          kitchenEvent('ORDER_CREATED', makeOrder({ id: `cycle-${cycle}`, orderNo: cycle })),
        ),
      );
      socket?.close();
      jest.advanceTimersByTime(INITIAL_RECONNECT_MS);
      await flushMicrotasks();
    }

    expect(delivered).toBe(300);
    expect(client.connectionState).toBe('connected');

    client.stop();
    jest.useRealTimers();
  });

  test('stop cancels reconnect timers immediately', async () => {
    jest.useFakeTimers();

    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {},
      random: () => 0,
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();
    mockSockets.latest?.close();
    await flushMicrotasks();

    expect(client.connectionState).toBe('reconnecting');

    client.stop();
    const socketsBefore = mockSockets.sockets.length;
    jest.advanceTimersByTime(MAX_RECONNECT_MS);
    await flushMicrotasks();

    expect(client.connectionState).toBe('disconnected');
    expect(mockSockets.sockets.length).toBe(socketsBefore);

    jest.useRealTimers();
  });

  test('handleAppForeground reconnects a dead socket', async () => {
    const client = new KitchenWebSocketClient({
      platform: 'native',
      getToken: async () => 'kitchen-token',
      onMessage: () => {},
      createSocket: createTrackedSocket(mockSockets.sockets),
    });

    client.start();
    await flushMicrotasks();

    mockSockets.latest?.close();
    await flushMicrotasks();
    expect(client.connectionState).toBe('reconnecting');

    client.handleAppForeground();
    await flushMicrotasks();

    expect(client.connectionState).toBe('connected');
    client.stop();
  });
});
