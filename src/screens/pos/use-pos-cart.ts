import { useCallback, useMemo, useState } from 'react';

import {
  addCartLine,
  cartItemCount,
  cartTotalCents,
  clearCart,
  decreaseCartLineQuantity,
  findCartLine,
  increaseCartLineQuantity,
  quantityForMenuItem,
  removeCartLineByVariant,
} from './cart';
import type { CartLine } from './types';

/**
 * POS cart state — mirrors RestoQuick_Nuxt_Web `useOrderCart` behavior.
 * Variant matching (menu + options + instructions) drives merge, increment, and remove.
 */
export function usePosCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addToCart = useCallback((line: CartLine) => {
    setLines((current) => addCartLine(current, line));
  }, []);

  const removeFromCart = useCallback((line: CartLine) => {
    setLines((current) => removeCartLineByVariant(current, line));
  }, []);

  const increaseQuantity = useCallback((line: CartLine) => {
    setLines((current) => increaseCartLineQuantity(current, line));
  }, []);

  const decreaseQuantity = useCallback((line: CartLine) => {
    setLines((current) => decreaseCartLineQuantity(current, line));
  }, []);

  const emptyCart = useCallback(() => {
    setLines(clearCart());
  }, []);

  const getQuantityForMenuItem = useCallback(
    (menuItemId: string) => quantityForMenuItem(lines, menuItemId),
    [lines]
  );

  const findLine = useCallback(
    (line: Pick<CartLine, 'menuItemId' | 'specialInstructions' | 'options'>) =>
      findCartLine(lines, line),
    [lines]
  );

  const itemCount = useMemo(() => cartItemCount(lines), [lines]);
  const subtotalCents = useMemo(() => cartTotalCents(lines), [lines]);

  return {
    lines,
    setLines,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    emptyCart,
    findLine,
    quantityForMenuItem: getQuantityForMenuItem,
    itemCount,
    subtotalCents,
  };
}
