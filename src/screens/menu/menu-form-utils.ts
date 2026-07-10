export function centsToPriceText(cents: number) {
  return (cents / 100).toFixed(2);
}

export function parsePriceCents(text: string): number | null {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
