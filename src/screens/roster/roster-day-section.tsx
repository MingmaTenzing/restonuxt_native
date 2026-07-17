import { Text, View } from 'react-native';

import { RosterShiftCard } from './roster-shift-card';
import type { ShiftDayGroup } from './roster-stats';
import type { Shift } from './types';

interface RosterDaySectionProps {
  group: ShiftDayGroup;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
}

export function RosterDaySection({ group, onEditShift, onDeleteShift }: RosterDaySectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">{group.label}</Text>
        <Text className="text-sm text-muted-foreground">
          {group.shifts.length} shift{group.shifts.length === 1 ? '' : 's'}
        </Text>
      </View>

      {group.shifts.length === 0 ? (
        <View
          className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-center text-sm text-muted-foreground">No shifts scheduled</Text>
        </View>
      ) : (
        <View className="gap-2">
          {group.shifts.map((shift) => (
            <RosterShiftCard
              key={shift.id}
              shift={shift}
              onPress={() => onEditShift(shift)}
              onDelete={() => onDeleteShift(shift)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
