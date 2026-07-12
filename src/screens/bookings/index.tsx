import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { unwrapList, type ApiClient } from '@/utils/api';

import { AddBookingModal } from './add-booking-modal';
import { BookingCard } from './booking-card';
import { computeBookingStats, filterBookings, type BookingFilter } from './booking-stats';
import { BookingFilterToggle, BookingStatsRow } from './booking-stats-row';
import type { Booking, NewBooking } from './types';

async function fetchBookings(api: ApiClient): Promise<Booking[]> {
  const payload = await api<unknown>('/api/bookings');
  return unwrapList<Booking>(payload, ['bookings', 'data']);
}

async function createBooking(api: ApiClient, booking: NewBooking): Promise<Booking> {
  return api<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ booking }),
  });
}

export default function BookingsScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const [isModalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<BookingFilter>('today');
  const { isTablet, fabStyle } = useResponsiveLayout();

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['bookings'],
    enabled: isReady,
    queryFn: () => fetchBookings(api),
  });

  const mutation = useMutation({
    mutationFn: (booking: NewBooking) => createBooking(api, booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setModalVisible(false);
    },
  });

  const stats = computeBookingStats(bookings);
  const visibleBookings = filterBookings(bookings, filter);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-background-dark">
        <Text className="text-base font-medium text-muted-foreground dark:text-muted-foreground-dark">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-background-dark">
        <Text className="text-center text-xl font-semibold text-foreground dark:text-foreground-dark">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          Sign in from the Home tab to view bookings.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScreenScroll bottomInset={72} refreshing={isFetching} onRefresh={() => refetch()}>
        <View className="gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground dark:text-foreground-dark ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Bookings
          </Text>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            {isLoading ? 'Loading bookings...' : `${bookings.length} bookings`}
          </Text>
        </View>

        {!isError && bookings.length > 0 ? <BookingStatsRow stats={stats} /> : null}

        {!isError && bookings.length > 0 ? (
          <BookingFilterToggle value={filter} onChange={setFilter} />
        ) : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load bookings
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load bookings.'}
              </Text>
            </View>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {!isLoading && !isError && bookings.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No bookings yet. Tap the + button to create one.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && bookings.length > 0 && visibleBookings.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No bookings for today. Switch to All to see every booking.
            </Text>
          </View>
        ) : null}

        <ResponsiveCardGrid>
          {visibleBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </ResponsiveCardGrid>
      </ScreenScroll>

      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add booking"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80 dark:bg-primary-dark"
        style={{
          ...fabStyle,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Text className="text-3xl font-light leading-none text-primary-foreground dark:text-primary-foreground-dark">
          +
        </Text>
      </Pressable>

      <AddBookingModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={(booking) => mutation.mutate(booking)}
        isSubmitting={mutation.isPending}
        errorMessage={mutation.isError ? (mutation.error as Error).message : null}
      />
    </>
  );
}
