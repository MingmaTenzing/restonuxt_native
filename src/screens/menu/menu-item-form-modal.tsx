import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { uploadImageToCloudinary } from '@/utils/cloudinary';

import { centsToPriceText, parsePriceCents } from './menu-form-utils';
import { MenuOptionsSection } from './menu-options-section';
import type { MenuItem, MenuItemInput, MenuOptionInput } from './types';

interface MenuItemFormModalProps {
  visible: boolean;
  item: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => void;
  onDelete: (item: MenuItem) => void;
  onCreateOption: (menuItemId: string, input: MenuOptionInput) => void;
  onUpdateOption: (optionId: string, input: MenuOptionInput) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  isSavingOption: boolean;
  errorMessage: string | null;
  optionError: string | null;
}

export function MenuItemFormModal({
  visible,
  item,
  categories,
  onClose,
  onSubmit,
  onDelete,
  onCreateOption,
  onUpdateOption,
  isSubmitting,
  isDeleting,
  isSavingOption,
  errorMessage,
  optionError,
}: MenuItemFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [draftOptions, setDraftOptions] = useState<MenuOptionInput[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setName(item?.name ?? '');
    setCategory(item?.category ?? '');
    setPrice(item ? centsToPriceText(item.priceCents) : '');
    setDescription(item?.description ?? '');
    setImageUrl(item?.imageUrl ?? '');
    setPreviewUri(item?.imageUrl ?? null);
    setDraftOptions([]);
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, item]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setValidationError('Photo library access is required to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setValidationError('Could not read the selected image.');
      return;
    }

    const uri = asset.uri;
    setPreviewUri(uri);
    setIsUploadingImage(true);
    setValidationError(null);

    try {
      const url = await uploadImageToCloudinary(asset.base64, asset.mimeType ?? 'image/jpeg');
      setImageUrl(url);
      setPreviewUri(url);
    } catch (error) {
      setPreviewUri(item?.imageUrl ?? null);
      setValidationError(error instanceof Error ? error.message : 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    const priceCents = parsePriceCents(price);
    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    if (!category.trim()) {
      setValidationError('Category is required.');
      return;
    }
    if (priceCents === null || priceCents <= 0) {
      setValidationError('Enter a valid price greater than 0.');
      return;
    }
    if (isUploadingImage) {
      setValidationError('Wait for the image upload to finish.');
      return;
    }

    setValidationError(null);
    onSubmit({
      name: name.trim(),
      category: category.trim(),
      priceCents,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      isAvailable: item ? item.isAvailable : true,
      options: item ? undefined : draftOptions.length > 0 ? draftOptions : undefined,
    });
  };

  const message = validationError ?? errorMessage;
  const isBusy = isSubmitting || isDeleting || isSavingOption || isUploadingImage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between border-b border-neutral-200/70 px-5 pb-4 pt-6 dark:border-border-dark">
          <Pressable onPress={onClose} hitSlop={12} disabled={isBusy}>
            <Text className="text-base font-medium text-primary dark:text-primary-dark">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {item ? 'Item details' : 'New item'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-10"
          keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={pickImage}
            disabled={isUploadingImage}
            accessibilityRole="button"
            accessibilityLabel="Choose menu item photo"
            className="relative h-56 w-full items-center justify-center bg-muted dark:bg-muted-dark">
            {previewUri ? (
              <Image source={{ uri: previewUri }} resizeMode="cover" className="h-full w-full" />
            ) : (
              <View className="items-center gap-2">
                <Ionicons name="image-outline" size={40} color="#8E8E93" />
                <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
                  Add a photo
                </Text>
              </View>
            )}
            {isUploadingImage ? (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator color="#FAFAFA" />
              </View>
            ) : (
              <View className="absolute bottom-4 right-4 rounded-full bg-primary px-3 py-2 dark:bg-primary-dark">
                <Text className="text-sm font-semibold text-primary-foreground dark:text-primary-foreground-dark">
                  {previewUri ? 'Change' : 'Upload'}
                </Text>
              </View>
            )}
          </Pressable>

          <View className="gap-4 px-5 pt-5">
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Margherita Pizza"
              autoCapitalize="words"
            />

            <View className="gap-2">
              <TextField
                label="Category"
                value={category}
                onChangeText={setCategory}
                placeholder="Mains"
                autoCapitalize="words"
              />
              {categories.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((option) => {
                    const isActive = option === category.trim();
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setCategory(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        className={`rounded-full px-3 py-1.5 ${
                          isActive
                            ? 'bg-primary dark:bg-primary-dark'
                            : 'bg-muted dark:bg-muted-dark'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            isActive
                              ? 'text-primary-foreground dark:text-primary-foreground-dark'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <TextField
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="12.50"
              keyboardType="decimal-pad"
            />
            <TextField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="San Marzano tomatoes, fresh basil..."
              autoCapitalize="sentences"
            />

            <MenuOptionsSection
              menuItemId={item?.id ?? null}
              savedOptions={item?.options ?? []}
              draftOptions={draftOptions}
              onDraftOptionsChange={setDraftOptions}
              onCreateOption={(input) => {
                if (item) onCreateOption(item.id, input);
              }}
              onUpdateOption={onUpdateOption}
              isSavingOption={isSavingOption}
              optionError={optionError}
            />

            {message ? (
              <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text>
            ) : null}

            <View className="mt-2 gap-3">
              <Button onPress={isBusy ? undefined : handleSubmit}>
                {isSubmitting ? 'Saving...' : item ? 'Save changes' : 'Add item'}
              </Button>
              {item ? (
                <Pressable
                  onPress={() => onDelete(item)}
                  disabled={isBusy}
                  accessibilityRole="button"
                  className="rounded-full border border-red-200 px-5 py-3.5 active:opacity-70 dark:border-red-900/50"
                  style={{ borderCurve: 'continuous' }}>
                  <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                    {isDeleting ? 'Deleting...' : 'Delete item'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
