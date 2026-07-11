import {
  type KitchenConnectionState,
  type KitchenWebSocketPayload,
  parseKitchenWebSocketMessage,
} from '@/screens/kitchen/types';
import { websocketUrl } from '@/utils/websocket-url';

export const WS_PATH = '/api/websocket';
export const PING_INTERVAL_MS = 30_000;
export const PONG_TIMEOUT_MS = 20_000;
export const INITIAL_RECONNECT_MS = 1_000;
export const MAX_RECONNECT_MS = 30_000;

type NativeWebSocketConstructor = {
  new (
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> },
  ): WebSocket;
};

export function nextReconnectDelay(attempt: number, random = Math.random) {
  const base = Math.min(INITIAL_RECONNECT_MS * 2 ** attempt, MAX_RECONNECT_MS);
  const jitter = Math.floor(random() * 500);
  return base + jitter;
}

export function buildKitchenWebSocketUrl(token: string, platform: 'web' | 'native') {
  if (platform === 'web') {
    return `${websocketUrl(WS_PATH)}?token=${encodeURIComponent(token)}`;
  }
  return websocketUrl(WS_PATH);
}

export function createKitchenSocket(
  url: string,
  token: string,
  platform: 'web' | 'native' = process.env.EXPO_OS === 'web' ? 'web' : 'native',
) {
  if (platform === 'web') {
    return new WebSocket(url);
  }

  const NativeWebSocket = WebSocket as unknown as NativeWebSocketConstructor;
  return new NativeWebSocket(url, [], { headers: { Authorization: `Bearer ${token}` } });
}

export interface KitchenWebSocketClientOptions {
  getToken: () => Promise<string | null>;
  onMessage: (message: KitchenWebSocketPayload) => void;
  onReconnect?: () => void;
  onStateChange?: (state: KitchenConnectionState) => void;
  platform?: 'web' | 'native';
  createSocket?: (url: string, token: string) => WebSocket;
  random?: () => number;
}

export class KitchenWebSocketClient {
  private enabled = false;
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private awaitingPong = false;
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private state: KitchenConnectionState = 'disconnected';

  private readonly getToken: () => Promise<string | null>;
  private readonly onMessage: (message: KitchenWebSocketPayload) => void;
  private readonly onReconnect?: () => void;
  private readonly onStateChange?: (state: KitchenConnectionState) => void;
  private readonly platform: 'web' | 'native';
  private readonly createSocket: (url: string, token: string) => WebSocket;
  private readonly random: () => number;

  constructor(options: KitchenWebSocketClientOptions) {
    this.getToken = options.getToken;
    this.onMessage = options.onMessage;
    this.onReconnect = options.onReconnect;
    this.onStateChange = options.onStateChange;
    this.platform = options.platform ?? (process.env.EXPO_OS === 'web' ? 'web' : 'native');
    this.createSocket =
      options.createSocket ??
      ((url, token) => createKitchenSocket(url, token, this.platform));
    this.random = options.random ?? Math.random;
  }

  get connectionState() {
    return this.state;
  }

  start() {
    this.enabled = true;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    void this.connect();
  }

  stop() {
    this.enabled = false;
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.closeSocket();
    this.setState('disconnected');
  }

  reconnect() {
    void this.connect();
  }

  handleAppForeground() {
    if (!this.enabled) return;

    const socket = this.ws;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      this.reconnectAttempt = 0;
      void this.connect();
      return;
    }

    if (this.awaitingPong) {
      socket.close();
    }
  }

  private setState(state: KitchenConnectionState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  private clearPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearPongTimer() {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    this.awaitingPong = false;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeSocket() {
    this.clearPingTimer();
    this.clearPongTimer();
    const socket = this.ws;
    this.ws = null;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }
  }

  private scheduleReconnect() {
    if (this.intentionalClose || !this.enabled) return;

    this.clearReconnectTimer();
    this.setState('reconnecting');

    const delay = nextReconnectDelay(this.reconnectAttempt, this.random);
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.clearPingTimer();
    this.clearPongTimer();

    this.pingTimer = setInterval(() => {
      const socket = this.ws;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      if (this.awaitingPong) {
        socket.close();
        return;
      }

      this.awaitingPong = true;
      socket.send('ping');

      this.pongTimer = setTimeout(() => {
        if (this.awaitingPong) {
          socket.close();
        }
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  private async connect() {
    if (!this.enabled || this.intentionalClose) return;

    this.clearReconnectTimer();
    this.closeSocket();
    this.setState(this.state === 'reconnecting' ? 'reconnecting' : 'connecting');

    const token = await this.getToken();
    if (!token) {
      this.setState('disconnected');
      this.scheduleReconnect();
      return;
    }

    const url = buildKitchenWebSocketUrl(token, this.platform);
    const socket = this.createSocket(url, token);
    this.ws = socket;

    socket.onopen = () => {
      const wasReconnect = this.reconnectAttempt > 0;
      this.reconnectAttempt = 0;
      this.setState('connected');
      this.startHeartbeat();

      if (wasReconnect) {
        this.onReconnect?.();
      }
    };

    socket.onmessage = (event) => {
      const raw = typeof event.data === 'string' ? event.data : String(event.data);

      if (raw === 'pong') {
        this.awaitingPong = false;
        this.clearPongTimer();
        return;
      }

      const message = parseKitchenWebSocketMessage(raw);
      if (message) {
        this.onMessage(message);
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      this.clearPingTimer();
      this.clearPongTimer();

      const wasCurrentSocket = this.ws === socket;
      if (wasCurrentSocket) {
        this.ws = null;
      }

      if (this.intentionalClose) {
        this.setState('disconnected');
        return;
      }

      if (!wasCurrentSocket) {
        return;
      }

      this.scheduleReconnect();
    };
  }
}
