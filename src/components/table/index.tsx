import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export { TableCell } from './cell';

export function Table({ children }: PropsWithChildren) {
  return (
    <View
      className="overflow-hidden rounded-3xl border border-border bg-card"
      style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
      {children}
    </View>
  );
}

export function TableRow({ children }: PropsWithChildren) {
  return (
    <View className="flex-row border-b border-border last:border-b-0">
      {children}
    </View>
  );
}
