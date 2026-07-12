import { UserButton } from '@clerk/expo/native';
import { View } from 'react-native';

export function DashboardUserAction() {
  return (
    <View
      className="h-10 w-10 overflow-hidden rounded-full border border-border"
      style={{ borderCurve: 'continuous' }}>
      <UserButton />
    </View>
  );
}
