import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export { TableCell } from './cell';

export function Table({ children }: PropsWithChildren) {
  return (
    <View className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">{children}</View>
  );
}

export function TableRow({ children }: PropsWithChildren) {
  return <View className="flex-row border-b border-zinc-100 last:border-b-0">{children}</View>;
}
