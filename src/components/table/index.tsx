import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export { TableCell } from './cell';

export function Table({ children }: PropsWithChildren) {
  return (
    <View
      className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      {children}
    </View>
  );
}

export function TableRow({ children }: PropsWithChildren) {
  return (
    <View className="flex-row border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
      {children}
    </View>
  );
}
