import type { MenuItemInput } from './types';

export function centsToPriceText(cents: number) {
  return (cents / 100).toFixed(2);
}

export function parsePriceCents(text: string): number | null {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** POST /api/menu expects Prisma nested-create shape (matches web AddMenuItemModal). */
export function buildCreateMenuItemBody(input: MenuItemInput) {
  const { options, ...fields } = input;
  return {
    name: fields.name,
    category: fields.category,
    priceCents: fields.priceCents,
    description: fields.description ?? '',
    imageUrl: fields.imageUrl ?? '',
    isAvailable: fields.isAvailable ?? true,
    options: {
      create: options ?? [],
    },
  };
}
