/** Keep time; replace calendar day from `picked`. */
export function applyDatePart(base: Date, picked: Date) {
  const next = new Date(base);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return next;
}

/** Keep calendar day; replace hours/minutes from `picked`. */
export function applyTimePart(base: Date, picked: Date) {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

export function formatDateTimeValue(date: Date, mode: 'date' | 'time' | 'datetime') {
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (mode === 'date') return datePart;
  if (mode === 'time') return timePart;
  return `${datePart} · ${timePart}`;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Values for `<input type="date|time|datetime-local">` on web. */
export function toWebInputValue(date: Date, mode: 'date' | 'time' | 'datetime') {
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  if (mode === 'date') return `${y}-${m}-${d}`;
  if (mode === 'time') return `${hh}:${mm}`;
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function fromWebInputValue(
  text: string,
  mode: 'date' | 'time' | 'datetime',
  base: Date
): Date | null {
  if (!text) return null;
  if (mode === 'time') {
    const match = /^(\d{1,2}):(\d{2})$/.exec(text);
    if (!match) return null;
    return applyTimePart(base, new Date(2000, 0, 1, Number(match[1]), Number(match[2])));
  }
  if (mode === 'date') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (!match) return null;
    return applyDatePart(
      base,
      new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    );
  }
  // datetime-local: YYYY-MM-DDTHH:mm
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0
  );
}
