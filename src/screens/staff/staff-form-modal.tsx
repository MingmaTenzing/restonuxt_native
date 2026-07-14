import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import {
  toggleWeekDay,
  validateStaffForm,
  validateStaffUpdateForm,
  type StaffFormDraft,
} from './staff-form-utils';
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  ROLE_LABELS,
  ROLES,
  WEEK_DAYS,
  type EmploymentType,
  type Role,
  type StaffInput,
  type StaffMember,
  type StaffUpdateInput,
  type WeekDay,
} from './types';

interface StaffFormModalProps {
  visible: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onSubmit: (input: StaffInput | StaffUpdateInput) => void;
  onDelete: (member: StaffMember) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
}

const DEFAULT_DRAFT: StaffFormDraft = {
  firstname: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'Waiter',
  employmentType: 'FullTime',
  perHourRate: '',
  availability: [],
  profilePhotoUrl: '',
};

function draftFromMember(member: StaffMember): StaffFormDraft {
  const rate =
    typeof member.perHourRate === 'string' ? member.perHourRate : String(member.perHourRate);

  return {
    firstname: member.firstname,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    role: member.role,
    employmentType: member.employmentType,
    perHourRate: rate,
    availability: member.availability ?? [],
    profilePhotoUrl: member.profile_photo_url ?? '',
  };
}

export function StaffFormModal({
  visible,
  member,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
  errorMessage,
}: StaffFormModalProps) {
  const [draft, setDraft] = useState<StaffFormDraft>(DEFAULT_DRAFT);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setDraft(member ? draftFromMember(member) : DEFAULT_DRAFT);
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, member]);

  const updateDraft = (patch: Partial<StaffFormDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = () => {
    const result = member ? validateStaffUpdateForm(draft) : validateStaffForm(draft);
    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    onSubmit(result.input);
  };

  const message = validationError ?? errorMessage;
  const isBusy = isSubmitting || isDeleting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isBusy}>
            <Text className="text-base font-medium text-primary">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            {member ? 'Edit staff' : 'New staff'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-5"
          keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="First name"
                value={draft.firstname}
                onChangeText={(firstname) => updateDraft({ firstname })}
                placeholder="Jane"
                autoCapitalize="words"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Last name"
                value={draft.lastName}
                onChangeText={(lastName) => updateDraft({ lastName })}
                placeholder="Doe"
                autoCapitalize="words"
              />
            </View>
          </View>

          <TextField
            label="Email"
            value={draft.email}
            onChangeText={(email) => updateDraft({ email })}
            placeholder="jane@restaurant.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextField
            label="Phone"
            value={draft.phone}
            onChangeText={(phone) => updateDraft({ phone })}
            placeholder="+61 400 000 000"
            keyboardType="phone-pad"
          />

          <TextField
            label="Hourly rate"
            value={draft.perHourRate}
            onChangeText={(perHourRate) => updateDraft({ perHourRate })}
            placeholder="25"
            keyboardType="decimal-pad"
          />

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">Role</Text>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.map((option) => {
                const isActive = option === draft.role;
                return (
                  <Pressable
                    key={option}
                    onPress={() => updateDraft({ role: option })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`rounded-full px-3 py-1.5 ${isActive ? 'bg-primary' : 'bg-muted'}`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {ROLE_LABELS[option as Role]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">Employment</Text>
            <View className="flex-row flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((option) => {
                const isActive = option === draft.employmentType;
                return (
                  <Pressable
                    key={option}
                    onPress={() => updateDraft({ employmentType: option })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`rounded-full px-3 py-1.5 ${isActive ? 'bg-primary' : 'bg-muted'}`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {EMPLOYMENT_TYPE_LABELS[option as EmploymentType]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">Availability</Text>
            <View className="flex-row flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const isActive = draft.availability.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() =>
                      updateDraft({
                        availability: toggleWeekDay(draft.availability, day as WeekDay),
                      })
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`rounded-full px-3 py-1.5 ${
                      isActive ? 'bg-primary' : 'border border-border bg-card'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {member ? (
            <TextField
              label="Profile photo URL"
              value={draft.profilePhotoUrl}
              onChangeText={(profilePhotoUrl) => updateDraft({ profilePhotoUrl })}
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}

          {message ? <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text> : null}

          <View className="mt-2 gap-3">
            <Button onPress={isBusy ? undefined : handleSubmit}>
              {isSubmitting ? 'Saving...' : member ? 'Save changes' : 'Add staff member'}
            </Button>
            {member ? (
              <Pressable
                onPress={() => onDelete(member)}
                disabled={isBusy}
                accessibilityRole="button"
                className="rounded-full border border-red-200 px-5 py-3.5 active:opacity-70 dark:border-red-900/50"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                  {isDeleting ? 'Deleting...' : 'Delete staff member'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
