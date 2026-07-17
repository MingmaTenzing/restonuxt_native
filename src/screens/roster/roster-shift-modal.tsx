import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import { toDateKey } from './roster-week';
import type { Shift, ShiftInput, StaffSummary } from './types';

interface RosterShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: ShiftInput) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  staff: StaffSummary[];
  initialShift?: Shift | null;
  defaultDateKey?: string;
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function RosterShiftModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  staff,
  initialShift,
  defaultDateKey,
}: RosterShiftModalProps) {
  const [staffId, setStaffId] = useState('');
  const [dateKey, setDateKey] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [position, setPosition] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed draft fields when the sheet opens. */
    if (initialShift) {
      setStaffId(initialShift.staffId);
      setDateKey(toDateKey(initialShift.date));
      setStartTime(initialShift.startTime);
      setEndTime(initialShift.endTime);
      setPosition(initialShift.position ?? '');
    } else {
      setStaffId(staff[0]?.id ?? '');
      setDateKey(defaultDateKey ?? toDateKey(new Date().toISOString()));
      setStartTime('09:00');
      setEndTime('17:00');
      setPosition('');
    }
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, initialShift, defaultDateKey, staff]);

  const handleSubmit = () => {
    if (!staffId) {
      setValidationError('Select a staff member.');
      return;
    }
    if (!dateKey) {
      setValidationError('Enter a shift date (YYYY-MM-DD).');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      setValidationError('Start and end times are required.');
      return;
    }

    const date = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      setValidationError('Enter a valid date (YYYY-MM-DD).');
      return;
    }

    onSubmit({
      staffId,
      date: date.toISOString(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      position: position.trim() || undefined,
    });
  };

  const selectedStaff = staff.find((member) => member.id === staffId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <Pressable onPress={onClose} hitSlop={8}>
            <Text className="text-base font-medium text-muted-foreground">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">
            {initialShift ? 'Edit shift' : 'Add shift'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 p-5"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">Staff member</Text>
            <View className="flex-row flex-wrap gap-2">
              {staff.map((member) => {
                const isActive = member.id === staffId;
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => setStaffId(member.id)}
                    className={`rounded-full px-4 py-2 ${isActive ? 'bg-primary' : 'bg-muted'}`}
                    style={{ borderCurve: 'continuous' }}>
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                      {member.firstname} {member.lastName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedStaff ? (
              <Text className="px-1 text-sm text-muted-foreground">
                Role: {formatLabel(selectedStaff.role)}
              </Text>
            ) : null}
          </View>

          <TextField
            label="Date (YYYY-MM-DD)"
            value={dateKey}
            onChangeText={setDateKey}
            placeholder="2026-07-15"
          />
          <TextField
            label="Start time"
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
          />
          <TextField
            label="End time"
            value={endTime}
            onChangeText={setEndTime}
            placeholder="17:00"
          />
          <TextField
            label="Position (optional)"
            value={position}
            onChangeText={setPosition}
            placeholder="e.g. Bar, Floor"
          />

          {validationError ? (
            <Text className="text-sm text-red-600 dark:text-red-400">{validationError}</Text>
          ) : null}
          {errorMessage ? (
            <Text className="text-sm text-red-600 dark:text-red-400">{errorMessage}</Text>
          ) : null}
        </ScrollView>

        <View className="border-t border-border px-5 py-4">
          <Button onPress={handleSubmit}>
            {isSubmitting ? 'Saving...' : initialShift ? 'Save changes' : 'Add shift'}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
