import { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
}

export function Button({ children, onPress }: ButtonProps) {
  return (
    <Pressable className="rounded-2xl bg-zinc-950 px-5 py-4 active:opacity-80" onPress={onPress}>
      <Text className="text-center text-base font-semibold text-white">{children}</Text>
    </Pressable>
  );
}
