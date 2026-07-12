import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { DateTimeField } from '@/components/date-time-field';
import { TextField } from '@/components/text-field';

import type { NewBooking } from './types';

interface AddBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (booking: NewBooking) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function AddBookingModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: AddBookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [specialRequest, setSpecialRequest] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setCustomerName('');
    setCustomerPhone('');
    setGuestCount('');
    setBookingDate(new Date(Date.now() + 60 * 60 * 1000));
    setSpecialRequest('');
    setValidationError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const guests = Number(guestCount);
    if (!customerName.trim() || !customerPhone.trim()) {
      setValidationError('Name and phone are required.');
      return;
    }
    if (!Number.isInteger(guests) || guests < 1) {
      setValidationError('Guest count must be a positive number.');
      return;
    }
    if (Number.isNaN(bookingDate.getTime())) {
      setValidationError('Please pick a valid date and time.');
      return;
    }

    setValidationError(null);
    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      guestCount: guests,
      bookingTime: bookingDate.toISOString(),
      specialRequest: specialRequest.trim() || undefined,
    });
  };

  const message = validationError ?? errorMessage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text className="text-base font-medium text-primary">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            New Booking
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-5"
          keyboardShouldPersistTaps="handled">
          <TextField
            label="Customer name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Jane Doe"
            autoCapitalize="words"
          />
          <TextField
            label="Phone"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="+61 400 000 000"
            keyboardType="phone-pad"
          />
          <TextField
            label="Guests"
            value={guestCount}
            onChangeText={setGuestCount}
            placeholder="2"
            keyboardType="number-pad"
          />
          <DateTimeField
            label="Date & time"
            value={bookingDate}
            onChange={setBookingDate}
            minimumDate={new Date()}
          />
          <TextField
            label="Special request"
            value={specialRequest}
            onChangeText={setSpecialRequest}
            placeholder="Window seat, birthday cake..."
            autoCapitalize="sentences"
          />

          {message ? (
            <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text>
          ) : null}

          <View className="mt-2">
            <Button onPress={handleSubmit}>{isSubmitting ? 'Saving...' : 'Create booking'}</Button>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
