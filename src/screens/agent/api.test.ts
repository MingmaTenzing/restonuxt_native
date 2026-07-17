import { afterEach, describe, expect, test } from 'bun:test';

import { withMockFetch } from '@/test/mock-fetch';

import { createChatMessageId, streamRestoAgentReply } from './api';
import type { ChatMessage } from './types';

const sampleMessages: ChatMessage[] = [
  { id: 'user-1', role: 'user', content: 'What is low in stock?' },
];

describe('createChatMessageId', () => {
  test('prefixes with role', () => {
    expect(createChatMessageId('user')).toMatch(/^user-/);
    expect(createChatMessageId('assistant')).toMatch(/^assistant-/);
  });
});

describe('streamRestoAgentReply', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('throws when messages are empty', async () => {
    await expect(
      streamRestoAgentReply(async () => 'token', [], () => {})
    ).rejects.toThrow('A messages array is required.');
  });

  test('throws when token is missing', async () => {
    await expect(
      streamRestoAgentReply(async () => null, sampleMessages, () => {})
    ).rejects.toThrow('Sign in again to continue.');
  });

  test('streams text chunks and posts messages body', async () => {
    const chunks: string[] = [];
    let capturedInit: RequestInit | undefined;
    let capturedUrl = '';

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Hello '));
        controller.enqueue(encoder.encode('from Resto Agent'));
        controller.close();
      },
    });

    restore = withMockFetch((input, init) => {
      capturedUrl = String(input);
      capturedInit = init;
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    });

    await streamRestoAgentReply(async () => 'token-abc', sampleMessages, (text) => {
      chunks.push(text);
    });

    expect(capturedUrl).toContain('/api/restoquick-agent');
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.headers).toMatchObject({
      Authorization: 'Bearer token-abc',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ messages: sampleMessages });
    expect(chunks.join('')).toBe('Hello from Resto Agent');
  });

  test('uses injected fetchImpl when provided', async () => {
    const chunks: string[] = [];
    const encoder = new TextEncoder();
    let usedInjected = false;

    const fetchImpl: typeof fetch = async (_input, _init) => {
      usedInjected = true;
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode('Injected stream'));
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    };

    await streamRestoAgentReply(async () => 'token', sampleMessages, (text) => {
      chunks.push(text);
    }, { fetchImpl });

    expect(usedInjected).toBe(true);
    expect(chunks.join('')).toBe('Injected stream');
  });

  test('sends cache-control and accept headers for streaming', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((_input, init) => {
      capturedInit = init;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    });

    await streamRestoAgentReply(async () => 'token', sampleMessages, () => {});

    expect(capturedInit?.headers).toMatchObject({
      Accept: 'text/plain',
      'Cache-Control': 'no-cache',
    });
  });

  test('throws when response body is missing', async () => {
    restore = withMockFetch(
      () =>
        ({
          ok: true,
          status: 200,
          body: null,
        }) as Response
    );

    await expect(
      streamRestoAgentReply(async () => 'token', sampleMessages, () => {})
    ).rejects.toThrow('Streaming is not available for this response.');
  });

  test('forwards abort signal to fetch', async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | null | undefined;

    restore = withMockFetch((_input, init) => {
      capturedSignal = init?.signal ?? null;
      return new Response(
        new ReadableStream({
          start(c) {
            c.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    });

    await streamRestoAgentReply(async () => 'token', sampleMessages, () => {}, {
      signal: controller.signal,
    });

    expect(capturedSignal).toBe(controller.signal);
  });

  test('surfaces API error messages', async () => {
    restore = withMockFetch(() =>
      new Response(JSON.stringify({ statusMessage: 'A messages array is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(
      streamRestoAgentReply(async () => 'token', sampleMessages, () => {})
    ).rejects.toThrow('A messages array is required.');
  });
});
