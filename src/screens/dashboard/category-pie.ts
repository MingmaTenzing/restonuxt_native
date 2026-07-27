import type { SoldByCategory } from './types';

import { categoryColor, categoryLabel, formatCategoryShare } from './dashboard-stats';

export type PieSlice = {
  category: string;
  label: string;
  color: string;
  percentage: number;
  path: string;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

/** SVG path for a pie slice from startAngle → endAngle (degrees, clockwise from 12 o'clock). */
export function describePieSlice(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return '';

  // Full circle can't be drawn as a single arc with identical endpoints.
  if (sweep >= 359.999) {
    const top = polarToCartesian(cx, cy, radius, 0);
    const bottom = polarToCartesian(cx, cy, radius, 180);
    return [
      `M ${cx} ${cy}`,
      `L ${top.x} ${top.y}`,
      `A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y}`,
      `A ${radius} ${radius} 0 1 1 ${top.x} ${top.y}`,
      'Z',
    ].join(' ');
  }

  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/** Build pie slices for sales-by-category (matches web SoldbyCategory_Piechart). */
export function buildCategoryPieSlices(
  categories: SoldByCategory[],
  size = 200
): PieSlice[] {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const shares = formatCategoryShare(categories).filter((item) => item.percentage > 0);

  let angle = 0;
  return shares.map((item) => {
    const sweep = (item.percentage / 100) * 360;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;

    return {
      category: item.category,
      label: item.label ?? categoryLabel(item.category),
      color: item.color ?? categoryColor(item.category),
      percentage: item.percentage,
      path: describePieSlice(cx, cy, radius, startAngle, endAngle),
    };
  });
}
