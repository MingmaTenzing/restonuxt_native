import type { MarkedStyles, UserTheme } from 'react-native-marked';

type AgentMarkdownPalette = {
  foreground: string;
  muted: string;
  border: string;
  codeBackground: string;
  link: string;
  background: string;
};

export function createAgentMarkdownTheme(palette: AgentMarkdownPalette): UserTheme {
  return {
    colors: {
      text: palette.foreground,
      link: palette.link,
      code: palette.foreground,
      border: palette.border,
      background: palette.background,
    },
  };
}

export function createAgentMarkdownStyles(palette: AgentMarkdownPalette): MarkedStyles {
  return {
    text: {
      color: palette.foreground,
      fontSize: 16,
      lineHeight: 26,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 10,
    },
    h1: {
      color: palette.foreground,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '700',
      marginBottom: 8,
    },
    h2: {
      color: palette.foreground,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '700',
      marginBottom: 8,
    },
    h3: {
      color: palette.foreground,
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '650',
      marginBottom: 6,
    },
    h4: {
      color: palette.foreground,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '650',
      marginBottom: 4,
    },
    strong: {
      color: palette.foreground,
      fontWeight: '700',
    },
    em: {
      color: palette.muted,
      fontStyle: 'italic',
    },
    link: {
      color: palette.link,
    },
    codespan: {
      color: palette.foreground,
      backgroundColor: palette.codeBackground,
      fontSize: 14,
      borderRadius: 4,
      paddingHorizontal: 4,
    },
    code: {
      backgroundColor: palette.codeBackground,
      borderRadius: 12,
      padding: 12,
      marginVertical: 8,
    },
    blockquote: {
      borderLeftColor: palette.border,
      borderLeftWidth: 3,
      paddingLeft: 12,
      marginVertical: 8,
      backgroundColor: palette.codeBackground,
    },
    list: {
      marginVertical: 6,
    },
    li: {
      color: palette.foreground,
      fontSize: 16,
      lineHeight: 26,
    },
    hr: {
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      marginVertical: 12,
    },
    table: {
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 10,
      marginVertical: 8,
    },
    tableRow: {
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
    },
    tableCell: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
  };
}
