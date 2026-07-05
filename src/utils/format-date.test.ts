import { formatDate } from './format-date';

export function runFormatDateTest() {
  const result = formatDate('2026-07-05T00:00:00.000Z');

  if (!result.includes('2026')) {
    throw new Error(`Expected formatted date to include 2026, received ${result}`);
  }
}
