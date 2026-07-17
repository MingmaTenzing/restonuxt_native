import { apiUrl } from '@/utils/api';

import type { ChatMessage } from './types';

export function createChatMessageId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const errorBody = (await response.json()) as { statusMessage?: string; message?: string };
    return errorBody.statusMessage ?? errorBody.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

type StreamFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/** Yield a macrotask so React can commit UI between stream chunks. */
function yieldToUi() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Streams a Resto Agent reply from `POST /api/restoquick-agent` (text/plain).
 * Prefer passing `fetch` from `expo/fetch` on device for reliable chunked streaming.
 */
export async function streamRestoAgentReply(
  getToken: () => Promise<string | null>,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  options?: {
    signal?: AbortSignal;
    fetchImpl?: StreamFetch;
  }
): Promise<void> {
  if (!messages.length) {
    throw new Error('A messages array is required.');
  }

  const token = await getToken();
  if (!token) {
    throw new Error('Sign in again to continue.');
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const response = await fetchImpl(apiUrl('/api/restoquick-agent'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      // Discourage intermediary buffering where supported.
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify({ messages }),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (!response.body) {
    throw new Error('Streaming is not available for this response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk =
      typeof value === 'string' ? value : decoder.decode(value, { stream: true });
    if (chunk) {
      onChunk(chunk);
      // Let React paint this chunk before we pull the next one.
      await yieldToUi();
    }
  }

  const rest = decoder.decode();
  if (rest) onChunk(rest);
}
