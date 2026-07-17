import { Image, Pressable, Text, View } from 'react-native';

import { formatDate } from '@/utils/format-date';

import { EMPLOYMENT_TYPE_LABELS, ROLE_LABELS, type StaffMember } from './types';
import { formatPerHourRate, getInitials } from './staff-utils';

interface StaffCardProps {
  member: StaffMember;
  onPress: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
      <Text selectable className="flex-1 text-right text-base text-foreground">
        {value}
      </Text>
    </View>
  );
}

export function StaffCard({ member, onPress }: StaffCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${member.firstname} ${member.lastName}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-center gap-4">
        {member.profile_photo_url ? (
          <Image source={{ uri: member.profile_photo_url }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-lg font-bold text-primary">
              {getInitials(member.firstname, member.lastName)}
            </Text>
          </View>
        )}

        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-foreground">
            {member.firstname} {member.lastName}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-semibold text-primary">
                {ROLE_LABELS[member.role]}
              </Text>
            </View>
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {EMPLOYMENT_TYPE_LABELS[member.employmentType]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="h-px bg-muted" />

      <View className="gap-3">
        <DetailRow label="Email" value={member.email} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Rate" value={formatPerHourRate(member.perHourRate)} />
        <DetailRow label="Joined" value={formatDate(member.joined_date)} />
      </View>

      {member.availability?.length ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Availability</Text>
          <View className="flex-row flex-wrap gap-2">
            {member.availability.map((day) => (
              <View
                key={day}
                className="rounded-xl border border-border bg-muted px-3 py-1.5">
                <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
