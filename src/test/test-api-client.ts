import { createApiClient, type ApiClient } from '@/utils/api';

/** Fixed-token ApiClient for unit tests (no Clerk provider required). */
export function testApiClient(token: string): ApiClient {
  return createApiClient(async () => token);
}
