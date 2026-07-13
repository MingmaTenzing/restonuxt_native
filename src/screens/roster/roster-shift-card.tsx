import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { staffDisplayName } from './roster-stats';
import type { Shift } from './types';

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

interface RosterShiftCardProps {
  shift: Shift;
  onPress: () => void;
  onDelete: () => void;
}

export function RosterShiftCard({ shift, onPress, onDelete }: RosterShiftCardProps) {
  const name = staffDisplayName(shift.staff);
  const role = shift.staff?.role ? formatLabel(shift.staff.role) : shift.position;

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
      style={{ borderCurve: 'continuous' }}>
      <Pressable onPress={onPress} className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-80">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-sm font-bold text-primary">
            {shift.staff ? `${shift.staff.firstname[0] ?? ''}${shift.staff.lastName[0] ?? ''}` : '?'}
          </Text>
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {role}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Text className="text-sm font-semibold text-foreground">
            {shift.startTime} – {shift.endTime}
          </Text>
          {shift.position ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {shift.position}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete shift"
        className="h-8 w-8 items-center justify-center rounded-full bg-muted active:opacity-70">
        <Ionicons name="trash-outline" size={16} color="#71717A" />
      </Pressable>
    </View>
  );
}
