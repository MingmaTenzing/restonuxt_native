import { Ionicons } from '@expo/vector-icons';
import { fetch as expoFetch } from 'expo/fetch';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeaderSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

import { AgentMessage, SuggestionChip } from './agent-message';
import {
  AGENT_SUGGESTIONS,
  buildOutgoingTurn,
  canSendAgentMessage,
  isStreamingAssistantMessage,
  mapVisibleMessages,
  resolveAssistantContentAfterStream,
} from './agent-chat';
import { createChatMessageId, streamRestoAgentReply } from './api';

export default function AgentScreen() {
  const { getToken, isLoaded, isSignedIn, isReady } = useApi();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [draft, setDraft] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState('');

  const hasConversation = messages.length > 0;
  const canSend = canSendAgentMessage(draft, isResponding, isReady);

  const visibleMessages = mapVisibleMessages(messages, streamingId, streamingText);

  useEffect(() => {
    if (!hasConversation) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [hasConversation, streamingText, messages.length, isResponding]);

  const sendMessage = async (rawContent?: string) => {
    const content = (rawContent ?? draft).trim();
    if (!content || isResponding || !isReady) return;

    const turn = buildOutgoingTurn(
      messages,
      content,
      createChatMessageId('user'),
      createChatMessageId('assistant')
    );
    const { historyForRequest, nextMessages, assistantMessage } = turn;

    setDraft('');
    setError('');
    setIsResponding(true);
    setStreamingText('');
    setStreamingId(assistantMessage.id);
    setMessages(nextMessages);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let assembled = '';

    try {
      await streamRestoAgentReply(
        getToken,
        historyForRequest,
        (chunk) => {
          assembled += chunk;
          // Dedicated streaming state (not messages[]) so each chunk forces a paint.
          setStreamingText(assembled);
        },
        {
          signal: controller.signal,
          fetchImpl: expoFetch as typeof fetch,
        }
      );

      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantMessage.id ? { ...item, content: assembled } : item
        )
      );
      setStreamingId(null);
      setStreamingText('');
    } catch (err) {
      if (controller.signal.aborted) return;

      const message =
        err instanceof Error ? err.message : 'Failed to stream assistant response.';
      setError(message);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantMessage.id
            ? {
                ...item,
                content: resolveAssistantContentAfterStream(assembled, message),
              }
            : item
        )
      );
      setStreamingId(null);
      setStreamingText('');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsResponding(false);
    }
  };

  const clearConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingId(null);
    setMessages([]);
    setStreamingText('');
    setDraft('');
    setError('');
    setIsResponding(false);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background px-5 pt-7">
        <ScreenHeaderSkeleton />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Ionicons name="sparkles" size={24} color={isDark ? '#18181B' : '#FAFAFA'} />
        </View>
        <Text className="mb-2 text-center text-2xl font-semibold text-foreground">
          Resto Agent
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Sign in to chat with your restaurant assistant.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View
        className="flex-row items-center justify-between border-b border-border px-4 pb-3"
        style={{ paddingTop: Math.max(insets.top, 12) }}>
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Ionicons name="sparkles" size={16} color={isDark ? '#18181B' : '#FAFAFA'} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">Resto Agent</Text>
            <Text className="text-xs text-muted-foreground">
              {isResponding ? 'Responding…' : 'Restaurant AI assistant'}
            </Text>
          </View>
        </View>
        {hasConversation ? (
          <Pressable
            onPress={clearConversation}
            className="rounded-full border border-border px-3 py-1.5 active:opacity-70"
            accessibilityLabel="New chat">
            <Text className="text-sm font-medium text-foreground">New chat</Text>
          </Pressable>
        ) : null}
      </View>

      {!hasConversation ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-3xl font-semibold text-foreground">
            Hi, how can I assist you?
          </Text>
          <Text className="mb-8 max-w-md text-center text-base text-muted-foreground">
            Ask about stock, orders, roster, menu, or anything else in your restaurant.
          </Text>
          <View className="w-full max-w-lg flex-row flex-wrap justify-center gap-2">
            {AGENT_SUGGESTIONS.map((suggestion) => (
              <SuggestionChip
                key={suggestion}
                label={suggestion}
                disabled={isResponding}
                onPress={() => sendMessage(suggestion)}
              />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-4 py-5"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {visibleMessages.map((item, index) => (
            <AgentMessage
              key={item.id}
              message={item}
              isStreaming={isStreamingAssistantMessage(
                isResponding,
                item.role,
                index,
                visibleMessages.length
              )}
            />
          ))}
        </ScrollView>
      )}

      {error && hasConversation ? (
        <Text className="px-4 pb-2 text-center text-sm text-destructive">{error}</Text>
      ) : null}

      <View
        className="border-t border-border bg-background px-3 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View
          className="flex-row items-end gap-2 rounded-[1.6rem] border border-border bg-card px-2 py-2"
          style={{ borderCurve: 'continuous' }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Resto Agent"
            placeholderTextColor={colors.mutedText}
            multiline
            editable={!isResponding}
            className="max-h-32 min-h-10 flex-1 px-2 py-2 text-base text-foreground"
            style={{ textAlignVertical: 'top' }}
            onSubmitEditing={() => {
              if (Platform.OS !== 'web') return;
              void sendMessage();
            }}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => void sendMessage()}
            disabled={!canSend}
            accessibilityLabel="Send message"
            className="h-10 w-10 items-center justify-center rounded-full bg-primary disabled:opacity-40"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={isDark ? '#18181B' : '#FAFAFA'}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
