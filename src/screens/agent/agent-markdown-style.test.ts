import remend from 'remend';
import { describe, expect, test } from 'bun:test';

import { createAgentMarkdownStyles, createAgentMarkdownTheme } from './agent-markdown-style';

const palette = {
  foreground: '#09090B',
  muted: '#71717A',
  border: '#E4E4E7',
  codeBackground: '#F4F4F5',
  link: '#2563EB',
  background: '#FFFFFF',
};

describe('createAgentMarkdownTheme', () => {
  test('maps palette into marked theme colors', () => {
    const theme = createAgentMarkdownTheme(palette);
    expect(theme.colors?.text).toBe('#09090B');
    expect(theme.colors?.link).toBe('#2563EB');
  });
});

describe('createAgentMarkdownStyles', () => {
  test('returns text styles for chat rendering', () => {
    const styles = createAgentMarkdownStyles(palette);
    expect(styles.text?.color).toBe('#09090B');
    expect(styles.h1?.fontSize).toBe(24);
  });
});

describe('remend streaming repair', () => {
  test('closes incomplete bold markers', () => {
    expect(remend('Stock is **low')).toMatch(/\*\*low\*\*/);
  });
});
