import { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
}

export function Button({ children, onPress }: ButtonProps) {
  return (
    <Pressable
      className="rounded-2xl bg-black px-5 py-4 active:opacity-80 dark:bg-white"
      style={{ borderCurve: 'continuous' }}
      onPress={onPress}>
      <Text className="text-center text-base font-semibold text-white dark:text-black">
        {children}
      </Text>
    </Pressable>
  );
}
