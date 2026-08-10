import { SignIn } from '@clerk/expo/web';
import { View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-5 py-8">
      <SignIn />
    </View>
  );
}
