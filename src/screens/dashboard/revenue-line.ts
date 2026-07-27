import type { RevenuePoint } from './types';

export type RevenueLineCoord = RevenuePoint & {
  x: number;
  y: number;
};

export type RevenueLineGeometry = {
  coords: RevenueLineCoord[];
  linePath: string;
  maxRevenueCents: number;
};

/**
 * Map daily revenue points into SVG coordinates for a line chart.
 * Y grows downward (SVG); higher revenue sits nearer the top padding.
 */
export function buildRevenueLineGeometry(
  points: RevenuePoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number } = {
    top: 28,
    right: 12,
    bottom: 8,
    left: 12,
  }
): RevenueLineGeometry {
  const maxRevenueCents = Math.max(...points.map((point) => point.revenueCents), 1);
  const plotWidth = Math.max(width - padding.left - padding.right, 1);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 1);
  const lastIndex = Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = padding.left + (index / lastIndex) * plotWidth;
    const y = padding.top + (1 - point.revenueCents / maxRevenueCents) * plotHeight;
    return { ...point, x, y };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(' ');

  return { coords, linePath, maxRevenueCents };
}
