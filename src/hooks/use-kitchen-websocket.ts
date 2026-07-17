import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { KitchenWebSocketClient } from '@/hooks/kitchen-websocket-client';
import type { KitchenConnectionState, KitchenWebSocketPayload } from '@/screens/kitchen/types';

interface UseKitchenWebSocketOptions {
  enabled: boolean;
  getToken: () => Promise<string | null>;
  onMessage: (message: KitchenWebSocketPayload) => void;
  onReconnect?: () => void;
}

export function useKitchenWebSocket({
  enabled,
  getToken,
  onMessage,
  onReconnect,
}: UseKitchenWebSocketOptions) {
  const [connectionState, setConnectionState] = useState<KitchenConnectionState>('disconnected');
  const clientRef = useRef<KitchenWebSocketClient | null>(null);
  const onMessageRef = useRef(onMessage);
  const onReconnectRef = useRef(onReconnect);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onReconnectRef.current = onReconnect;
    getTokenRef.current = getToken;
  });

  useEffect(() => {
    const client = new KitchenWebSocketClient({
      getToken: () => getTokenRef.current(),
      onMessage: (message) => onMessageRef.current(message),
      onReconnect: () => onReconnectRef.current?.(),
      onStateChange: setConnectionState,
    });

    clientRef.current = client;

    if (enabled) {
      client.start();
    } else {
      client.stop();
    }

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, [enabled]);

  const reconnect = useCallback(() => {
    clientRef.current?.reconnect();
  }, []);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        clientRef.current?.handleAppForeground();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  return { connectionState, reconnect };
}
