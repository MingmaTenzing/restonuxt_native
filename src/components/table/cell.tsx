import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

interface TableCellProps extends PropsWithChildren {
  label?: string;
}

export function TableCell({ children, label }: TableCellProps) {
  return (
    <View className="flex-1 gap-1 px-4 py-3">
      {label ? (
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
      ) : null}
      <Text className="text-base text-foreground">{children}</Text>
    </View>
  );
}
