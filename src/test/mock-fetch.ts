type FetchHandler = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Response | Promise<Response>;

export function withMockFetch(handler: FetchHandler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

export function jsonResponse<T>(body: T, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
