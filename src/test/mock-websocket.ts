export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  sent: string[] = [];

  constructor(
    public readonly url: string,
    public readonly protocols?: string | string[],
    public readonly options?: { headers?: Record<string, string> },
  ) {}

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sent.push(data);
  }

  close() {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  simulateError() {
    this.onerror?.();
    this.close();
  }
}

export function installMockWebSocket() {
  const sockets: MockWebSocket[] = [];

  const factory = function MockWebSocketFactory(
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> },
  ) {
    const socket = new MockWebSocket(url, protocols, options);
    sockets.push(socket);
    queueMicrotask(() => socket.simulateOpen());
    return socket as unknown as WebSocket;
  } as unknown as typeof WebSocket;

  Object.assign(factory, {
    CONNECTING: MockWebSocket.CONNECTING,
    OPEN: MockWebSocket.OPEN,
    CLOSING: MockWebSocket.CLOSING,
    CLOSED: MockWebSocket.CLOSED,
  });

  globalThis.WebSocket = factory;

  return {
    sockets,
    get latest() {
      return sockets.at(-1) ?? null;
    },
    reset() {
      sockets.length = 0;
    },
  };
}
