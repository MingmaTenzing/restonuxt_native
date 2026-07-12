// RestoQuick stores money as integer CENTS (see RESTOQUICK_DOC.md).
export function formatMoney(cents: number, currency = 'USD') {
  const amount = (cents ?? 0) / 100;
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
