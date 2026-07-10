import { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
}

export function Button({ children, onPress }: ButtonProps) {
  return (
    <Pressable
      className="rounded-full bg-primary px-5 py-3.5 active:opacity-80 dark:bg-primary-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)' }}
      onPress={onPress}>
      <Text className="text-center text-base font-semibold text-primary-foreground dark:text-primary-foreground-dark">
        {children}
      </Text>
    </Pressable>
  );
}
