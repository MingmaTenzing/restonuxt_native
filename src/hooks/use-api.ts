import { useAuth } from '@clerk/expo';
import { useMemo } from 'react';

import { createApiClient, type ApiClient } from '@/utils/api';

/**
 * Clerk-authenticated API client for RestoQuick.
 * Injects the session JWT via `getToken()` — no manual Authorization headers in screens.
 */
export function useApi() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const api = useMemo<ApiClient>(() => createApiClient(getToken), [getToken]);

  return {
    api,
    /** Raw token accessor — use for WebSockets or other non-fetch transports. */
    getToken,
    isLoaded,
    isSignedIn,
    isReady: isLoaded && isSignedIn,
  };
}
