import remend from 'remend';
import { useMarkdown } from 'react-native-marked';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { createAgentMarkdownStyles, createAgentMarkdownTheme } from './agent-markdown-style';
import { getAssistantMessageMode } from './agent-chat';
import type { ChatMessage } from './types';

type AgentMessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
};

export function AgentMessage({ message, isStreaming = false }: AgentMessageProps) {
  const { colors, isDark, colorScheme } = useTheme();
  const isUser = message.role === 'user';
  const messageMode = isUser ? null : getAssistantMessageMode(message.content, isStreaming);
  const showThinking = messageMode === 'thinking';
  const iconColor = colors.primaryForeground;

  const palette = useMemo(
    () => ({
      foreground: colors.text,
      muted: colors.mutedText,
      border: colors.border,
      codeBackground: isDark ? '#27272A' : '#F4F4F5',
      link: isDark ? '#93C5FD' : '#2563EB',
      background: colors.background,
    }),
    [colors.background, colors.border, colors.mutedText, colors.text, isDark]
  );

  const finishedMarkdown = messageMode === 'markdown' ? message.content : '';

  const markdownOptions = useMemo(
    () => ({
      colorScheme,
      theme: createAgentMarkdownTheme(palette),
      styles: createAgentMarkdownStyles(palette),
    }),
    [colorScheme, palette]
  );

  const elements = useMarkdown(finishedMarkdown, markdownOptions);

  const streamingText = useMemo(() => {
    if (messageMode !== 'streaming' || !message.content) return '';
    return remend(message.content);
  }, [messageMode, message.content]);

  if (isUser) {
    return (
      <View className="mb-5 w-full flex-row justify-end px-1">
        <View
          className="max-w-[88%] rounded-3xl bg-secondary px-4 py-3"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-secondary-foreground" selectable>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-5 w-full flex-row items-start gap-3 px-1">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Ionicons name="sparkles" size={14} color={iconColor} />
      </View>
      <View className="min-w-0 flex-1 pt-0.5">
        <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Resto Agent
        </Text>
        {showThinking ? (
          <View
            className="flex-row items-center gap-2 self-start rounded-2xl bg-accent/80 px-3 py-2.5"
            accessibilityLabel="Assistant is thinking"
            accessibilityRole="progressbar">
            <ActivityIndicator size="small" />
            <Text className="text-sm text-muted-foreground">Thinking…</Text>
          </View>
        ) : messageMode === 'streaming' ? (
          <Text className="text-base leading-7 text-foreground" selectable>
            {streamingText}
            <Text className="text-muted-foreground">▍</Text>
          </Text>
        ) : finishedMarkdown.trim() ? (
          <View>
            {elements.map((element, index) => (
              <Fragment key={`agent-md-${message.id}-${index}`}>{element}</Fragment>
            ))}
          </View>
        ) : (
          <Text className="text-base leading-7 text-foreground" selectable>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

type SuggestionChipProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SuggestionChip({ label, onPress, disabled }: SuggestionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="rounded-full border border-border bg-card px-4 py-2.5 active:opacity-70 disabled:opacity-40"
      style={{ borderCurve: 'continuous' }}>
      <Text className="text-sm text-foreground">{label}</Text>
    </Pressable>
  );
}
