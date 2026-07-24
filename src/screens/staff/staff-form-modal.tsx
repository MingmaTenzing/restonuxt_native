import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { getStaffUploadPreset, uploadImageToCloudinary } from '@/utils/cloudinary';

import {
  getStaffPhotoSizeError,
  STAFF_PHOTO_MAX_KB,
  toggleWeekDay,
  validateStaffForm,
  validateStaffUpdateForm,
  type StaffFormDraft,
} from './staff-form-utils';
import { getInitials } from './staff-utils';
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
  const isDark = useColorScheme() === 'dark';
  const [draft, setDraft] = useState<StaffFormDraft>(DEFAULT_DRAFT);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    const next = member ? draftFromMember(member) : DEFAULT_DRAFT;
    setDraft(next);
    setPreviewUri(next.profilePhotoUrl || null);
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, member]);

  const updateDraft = (patch: Partial<StaffFormDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setValidationError('Photo library access is required to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const sizeError = getStaffPhotoSizeError(asset.fileSize);
    if (sizeError) {
      setValidationError(sizeError);
      return;
    }

    if (!asset.base64) {
      setValidationError('Could not read the selected image.');
      return;
    }

    const uploadPreset = getStaffUploadPreset();
    if (!uploadPreset) {
      setValidationError('Cloudinary is not configured. Add EXPO_PUBLIC_CLOUDINARY_* to .env');
      return;
    }

    const previousUrl = draft.profilePhotoUrl || null;
    setPreviewUri(asset.uri);
    setIsUploadingImage(true);
    setValidationError(null);

    try {
      const url = await uploadImageToCloudinary(asset.base64, asset.mimeType ?? 'image/jpeg', {
        uploadPreset,
      });
      updateDraft({ profilePhotoUrl: url });
      setPreviewUri(url);
    } catch (error) {
      setPreviewUri(previousUrl);
      setValidationError(error instanceof Error ? error.message : 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    if (isUploadingImage) {
      setValidationError('Wait for the image upload to finish.');
      return;
    }

    const result = member ? validateStaffUpdateForm(draft) : validateStaffForm(draft);
    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    onSubmit(result.input);
  };

  const message = validationError ?? errorMessage;
  const isBusy = isSubmitting || isDeleting || isUploadingImage;
  const initials = getInitials(draft.firstname, draft.lastName);

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
          <View className="items-center gap-2">
            <Pressable
              onPress={pickImage}
              disabled={isUploadingImage}
              accessibilityRole="button"
              accessibilityLabel="Choose staff profile photo"
              className="relative h-24 w-24 items-center justify-center">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted">
                {previewUri ? (
                  <Image source={{ uri: previewUri }} resizeMode="cover" className="h-full w-full" />
                ) : (
                  <View className="items-center justify-center">
                    {initials !== '?' ? (
                      <Text className="text-2xl font-bold text-primary">{initials}</Text>
                    ) : (
                      <Ionicons name="person-outline" size={32} color="#8E8E93" />
                    )}
                  </View>
                )}
                {isUploadingImage ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <ActivityIndicator color="#FAFAFA" />
                  </View>
                ) : null}
              </View>
              {!isUploadingImage ? (
                <View className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5">
                  <Ionicons name="camera" size={14} color={isDark ? '#18181B' : '#FAFAFA'} />
                </View>
              ) : null}
            </Pressable>
            <Text className="text-sm text-muted-foreground">
              Profile picture (optional, max {STAFF_PHOTO_MAX_KB}KB)
            </Text>
            <Pressable onPress={pickImage} disabled={isUploadingImage} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">
                {previewUri ? 'Change photo' : 'Add photo'}
              </Text>
            </Pressable>
          </View>

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
