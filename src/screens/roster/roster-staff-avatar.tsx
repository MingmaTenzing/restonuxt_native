import { Image, Text, View } from 'react-native';

import { getInitials } from '@/screens/staff/staff-utils';

import type { StaffSummary } from './types';

interface RosterStaffAvatarProps {
  staff?: StaffSummary | null;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: { box: 'h-9 w-9', text: 'text-xs' },
  md: { box: 'h-10 w-10', text: 'text-sm' },
} as const;

export function RosterStaffAvatar({ staff, size = 'md' }: RosterStaffAvatarProps) {
  const classes = SIZES[size];
  const photoUrl = staff?.profile_photo_url;

  if (photoUrl) {
    return (
      <View className={`${classes.box} overflow-hidden rounded-full bg-muted`}>
        <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
      </View>
    );
  }

  return (
    <View className={`${classes.box} items-center justify-center rounded-full bg-primary/10`}>
      <Text className={`${classes.text} font-bold text-primary`}>
        {staff ? getInitials(staff.firstname, staff.lastName) : '?'}
      </Text>
    </View>
  );
}
