import type { CartLine, CartOption, OrderItemCreateInput } from './types';

export function lineOptionsTotalCents(options: CartOption[]) {
  return options.reduce((sum, option) => sum + option.priceCents * option.quantity, 0);
}

export function lineTotalCents(line: CartLine) {
  return (line.unitPriceCents + lineOptionsTotalCents(line.options)) * line.quantity;
}

export function cartTotalCents(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function buildOrderItemCreates(lines: CartLine[]): OrderItemCreateInput[] {
  return lines.map((line) => {
    const input: OrderItemCreateInput = {
      menuItemId: line.menuItemId,
      itemName: line.itemName,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    };

    if (line.specialInstructions) {
      input.specialInstructions = line.specialInstructions;
    }

    if (line.options.length > 0) {
      input.orderItemOptions = {
        create: line.options.map((option) => ({
          menuOptionId: option.menuOptionId,
          quantity: option.quantity,
          name: option.name,
          priceCents: option.priceCents,
        })),
      };
    }

    return input;
  });
}

export function createCartLineId() {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Stable key for matching cart lines that should combine into one ticket row. */
export function cartLineMergeKey(
  line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  const normalizedOptions = [...line.options]
    .sort((a, b) => a.menuOptionId.localeCompare(b.menuOptionId))
    .map((option) => `${option.menuOptionId}:${option.quantity}`)
    .join('|');
  const instructions = line.specialInstructions ?? '';
  return `${line.menuItemId}::${instructions}::${normalizedOptions}`;
}

export function areCartLinesMergeable(
  a: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>,
  b: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  return cartLineMergeKey(a) === cartLineMergeKey(b);
}

/** Find a cart line with the same menu item, options, and instructions (value-based). */
export function findCartLine(
  lines: CartLine[],
  line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  return lines.find((existing) => areCartLinesMergeable(existing, line));
}

/** Sum quantities for a menu item across all variant rows (matches web quantity_for_menu_item). */
export function quantityForMenuItem(lines: CartLine[], menuItemId: string) {
  return lines
    .filter((line) => line.menuItemId === menuItemId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

export function addCartLine(lines: CartLine[], line: CartLine) {
  const matchIndex = lines.findIndex((existing) => areCartLinesMergeable(existing, line));
  if (matchIndex === -1) return [...lines, line];

  return lines.map((existing, index) =>
    index === matchIndex
      ? { ...existing, quantity: existing.quantity + line.quantity }
      : existing
  );
}

export function updateCartLineQuantity(lines: CartLine[], lineId: string, quantity: number) {
  if (quantity < 1) return removeCartLine(lines, lineId);
  return lines.map((line) => (line.id === lineId ? { ...line, quantity } : line));
}

/** Increase quantity for the matching variant; no-op if not found (matches web increase_quantity). */
export function increaseCartLineQuantity(
  lines: CartLine[],
  line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  const match = findCartLine(lines, line);
  if (!match) return lines;
  return updateCartLineQuantity(lines, match.id, match.quantity + 1);
}

/** Decrease quantity for the matching variant; removes the row at 1 (matches web decrease_quantity). */
export function decreaseCartLineQuantity(
  lines: CartLine[],
  line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  const match = findCartLine(lines, line);
  if (!match) return lines;
  return updateCartLineQuantity(lines, match.id, match.quantity - 1);
}

export function removeCartLine(lines: CartLine[], lineId: string) {
  return lines.filter((line) => line.id !== lineId);
}

/** Remove the exact variant from the cart (matches web remove_from_cart). */
export function removeCartLineByVariant(
  lines: CartLine[],
  line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>
) {
  return lines.filter((existing) => !areCartLinesMergeable(existing, line));
}

export function clearCart(): CartLine[] {
  return [];
}
