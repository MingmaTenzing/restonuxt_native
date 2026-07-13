import type { ChatMessage } from './types';

export const AGENT_SUGGESTIONS = [
  'What needs restocking?',
  'Summarize today’s orders',
  'Help me plan this week’s roster',
  'Any unpaid takeaway orders?',
] as const;

export type AssistantMessageMode = 'thinking' | 'streaming' | 'markdown' | 'plain';

/** Overlay live stream text onto the in-progress assistant message. */
export function mapVisibleMessages(
  messages: ChatMessage[],
  streamingId: string | null,
  streamingText: string
): ChatMessage[] {
  if (!streamingId) return messages;
  return messages.map((message) =>
    message.id === streamingId ? { ...message, content: streamingText } : message
  );
}

export function canSendAgentMessage(
  draft: string,
  isResponding: boolean,
  isReady: boolean
): boolean {
  return Boolean(draft.trim()) && !isResponding && isReady;
}

export function getAssistantMessageMode(
  content: string,
  isStreaming: boolean
): AssistantMessageMode {
  if (isStreaming && !content.trim()) return 'thinking';
  if (isStreaming) return 'streaming';
  if (content.trim()) return 'markdown';
  return 'plain';
}

export function isStreamingAssistantMessage(
  isResponding: boolean,
  role: ChatMessage['role'],
  index: number,
  total: number
): boolean {
  return isResponding && role === 'assistant' && index === total - 1;
}

export function buildOutgoingTurn(
  messages: ChatMessage[],
  content: string,
  userId: string,
  assistantId: string
) {
  const trimmed = content.trim();
  const userMessage: ChatMessage = { id: userId, role: 'user', content: trimmed };
  const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', content: '' };

  return {
    historyForRequest: [...messages, userMessage],
    userMessage,
    assistantMessage,
    nextMessages: [...messages, userMessage, assistantMessage],
  };
}

/** Pick final assistant content after stream success or failure. */
export function resolveAssistantContentAfterStream(
  assembled: string,
  errorMessage?: string | null
): string {
  if (assembled.trim()) return assembled;
  return errorMessage?.trim() ?? '';
}
