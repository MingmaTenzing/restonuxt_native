import { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
  disabled?: boolean;
}

export function Button({ children, onPress, disabled = false }: ButtonProps) {
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      disabled={isDisabled}
      className={`rounded-full px-5 py-3.5 ${
        isDisabled ? 'bg-muted opacity-70' : 'bg-primary active:opacity-80'
      }`}
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)' }}
      onPress={onPress}>
      <Text
        className={`text-center text-base font-semibold ${
          isDisabled ? 'text-muted-foreground' : 'text-primary-foreground'
        }`}>
        {children}
      </Text>
    </Pressable>
  );
}
