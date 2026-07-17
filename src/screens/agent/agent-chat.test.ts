import { describe, expect, test } from 'bun:test';

import {
  AGENT_SUGGESTIONS,
  buildOutgoingTurn,
  canSendAgentMessage,
  getAssistantMessageMode,
  isStreamingAssistantMessage,
  mapVisibleMessages,
  resolveAssistantContentAfterStream,
} from './agent-chat';
import type { ChatMessage } from './types';

const history: ChatMessage[] = [
  { id: 'user-1', role: 'user', content: 'Hello' },
  { id: 'assistant-1', role: 'assistant', content: 'Hi there' },
];

describe('AGENT_SUGGESTIONS', () => {
  test('includes stock and roster prompts', () => {
    expect(AGENT_SUGGESTIONS).toContain('What needs restocking?');
    expect(AGENT_SUGGESTIONS).toHaveLength(4);
  });
});

describe('mapVisibleMessages', () => {
  test('returns messages unchanged when not streaming', () => {
    expect(mapVisibleMessages(history, null, '')).toEqual(history);
  });

  test('overlays streaming text on the active assistant message', () => {
    const streaming = [
      ...history,
      { id: 'user-2', role: 'user' as const, content: 'Stock?' },
      { id: 'assistant-2', role: 'assistant' as const, content: '' },
    ];

    const visible = mapVisibleMessages(streaming, 'assistant-2', 'Checking stock');
    expect(visible.at(-1)?.content).toBe('Checking stock');
    expect(visible[0]).toEqual(history[0]);
  });
});

describe('canSendAgentMessage', () => {
  test('allows send when draft is non-empty and session is ready', () => {
    expect(canSendAgentMessage('Hello', false, true)).toBe(true);
  });

  test('blocks empty or whitespace-only drafts', () => {
    expect(canSendAgentMessage('', false, true)).toBe(false);
    expect(canSendAgentMessage('   ', false, true)).toBe(false);
  });

  test('blocks while responding or auth is not ready', () => {
    expect(canSendAgentMessage('Hello', true, true)).toBe(false);
    expect(canSendAgentMessage('Hello', false, false)).toBe(false);
  });
});

describe('getAssistantMessageMode', () => {
  test('shows thinking before first token', () => {
    expect(getAssistantMessageMode('', true)).toBe('thinking');
    expect(getAssistantMessageMode('   ', true)).toBe('thinking');
  });

  test('streams plain text while tokens arrive', () => {
    expect(getAssistantMessageMode('Partial', true)).toBe('streaming');
  });

  test('renders markdown after stream completes', () => {
    expect(getAssistantMessageMode('**Done**', false)).toBe('markdown');
  });

  test('falls back to plain for empty finished messages', () => {
    expect(getAssistantMessageMode('', false)).toBe('plain');
  });
});

describe('isStreamingAssistantMessage', () => {
  test('marks only the last assistant bubble while responding', () => {
    expect(isStreamingAssistantMessage(true, 'assistant', 2, 3)).toBe(true);
    expect(isStreamingAssistantMessage(true, 'assistant', 1, 3)).toBe(false);
    expect(isStreamingAssistantMessage(true, 'user', 2, 3)).toBe(false);
    expect(isStreamingAssistantMessage(false, 'assistant', 2, 3)).toBe(false);
  });
});

describe('buildOutgoingTurn', () => {
  test('appends user and empty assistant messages to history', () => {
    const turn = buildOutgoingTurn(history, 'What is low?', 'user-2', 'assistant-2');

    expect(turn.historyForRequest).toEqual([
      ...history,
      { id: 'user-2', role: 'user', content: 'What is low?' },
    ]);
    expect(turn.nextMessages).toEqual([
      ...history,
      { id: 'user-2', role: 'user', content: 'What is low?' },
      { id: 'assistant-2', role: 'assistant', content: '' },
    ]);
  });

  test('trims user content', () => {
    const turn = buildOutgoingTurn([], '  stock check  ', 'user-1', 'assistant-1');
    expect(turn.userMessage.content).toBe('stock check');
  });
});

describe('resolveAssistantContentAfterStream', () => {
  test('prefers assembled stream text', () => {
    expect(resolveAssistantContentAfterStream('All good')).toBe('All good');
  });

  test('uses error message when stream produced nothing', () => {
    expect(resolveAssistantContentAfterStream('', 'Request failed')).toBe('Request failed');
    expect(resolveAssistantContentAfterStream('   ', 'Request failed')).toBe('Request failed');
  });

  test('returns empty string when neither content nor error exists', () => {
    expect(resolveAssistantContentAfterStream('')).toBe('');
  });
});
