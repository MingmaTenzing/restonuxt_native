export function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

export function formatPerHourRate(rate: number | string) {
  const value = typeof rate === 'string' ? Number(rate) : rate;
  if (!Number.isFinite(value)) return `$${rate}/hr`;
  return `$${value.toFixed(2).replace(/\.00$/, '')}/hr`;
}
