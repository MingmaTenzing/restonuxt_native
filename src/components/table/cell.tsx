import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

interface TableCellProps extends PropsWithChildren {
  label?: string;
}

export function TableCell({ children, label }: TableCellProps) {
  return (
    <View className="flex-1 gap-1 px-4 py-3">
      {label ? (
        <Text className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
          {label}
        </Text>
      ) : null}
      <Text className="text-base text-neutral-900 dark:text-neutral-50">{children}</Text>
    </View>
  );
}
