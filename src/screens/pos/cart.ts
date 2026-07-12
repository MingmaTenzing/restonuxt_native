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

export function addCartLine(lines: CartLine[], line: CartLine) {
  return [...lines, line];
}

export function updateCartLineQuantity(lines: CartLine[], lineId: string, quantity: number) {
  if (quantity < 1) return removeCartLine(lines, lineId);
  return lines.map((line) => (line.id === lineId ? { ...line, quantity } : line));
}

export function removeCartLine(lines: CartLine[], lineId: string) {
  return lines.filter((line) => line.id !== lineId);
}
