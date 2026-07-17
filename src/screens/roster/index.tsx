import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { CardGridSkeleton, ListScreenSkeleton, StatsRowSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import {
  createShift,
  deleteShift,
  fetchLeaveRequests,
  fetchRosterOverview,
  fetchShifts,
  fetchStaff,
  updateLeaveStatus,
  updateShift,
} from './api';
import { RosterDaySection } from './roster-day-section';
import { RosterLeaveCard } from './roster-leave-card';
import { RosterShiftModal } from './roster-shift-modal';
import { filterLeaveRequests, groupShiftsByDay } from './roster-stats';
import { RosterStatsRow, RosterViewToggle } from './roster-stats-row';
import { formatWeekLabel, shiftWeek, toWeekRange } from './roster-week';
import type { RosterView, Shift, ShiftInput } from './types';

export default function RosterScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const { isTablet, fabStyle } = useResponsiveLayout();

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [view, setView] = useState<RosterView>('shifts');
  const [isShiftModalVisible, setShiftModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const week = useMemo(() => toWeekRange(weekAnchor), [weekAnchor]);
  const weekLabel = formatWeekLabel(week.start, week.end);

  const invalidateRoster = () => {
    queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    queryClient.invalidateQueries({ queryKey: ['roster-overview'] });
    queryClient.invalidateQueries({ queryKey: ['roster-leave'] });
  };

  const staffQuery = useQuery({
    queryKey: ['staff'],
    enabled: isReady,
    queryFn: () => fetchStaff(api),
  });

  const shiftsQuery = useQuery({
    queryKey: ['roster-shifts', week.startIso, week.endIso],
    enabled: isReady,
    queryFn: () => fetchShifts(api, week.startIso, week.endIso),
  });

  const leaveQuery = useQuery({
    queryKey: ['roster-leave'],
    enabled: isReady,
    queryFn: () => fetchLeaveRequests(api),
  });

  const overviewQuery = useQuery({
    queryKey: ['roster-overview', week.startIso, week.endIso],
    enabled: isReady,
    queryFn: () => fetchRosterOverview(api, week.startIso, week.endIso),
  });

  const createShiftMutation = useMutation({
    mutationFn: (input: ShiftInput) => createShift(api, input),
    onSuccess: () => {
      invalidateRoster();
      setShiftModalVisible(false);
      setEditingShift(null);
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ShiftInput> }) =>
      updateShift(api, id, input),
    onSuccess: () => {
      invalidateRoster();
      setShiftModalVisible(false);
      setEditingShift(null);
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => deleteShift(api, id),
    onSuccess: invalidateRoster,
  });

  const leaveStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      updateLeaveStatus(api, id, status),
    onSuccess: invalidateRoster,
  });

  const shiftGroups = useMemo(
    () => groupShiftsByDay(shiftsQuery.data ?? [], week.start),
    [shiftsQuery.data, week.start]
  );

  const pendingLeave = filterLeaveRequests(leaveQuery.data ?? [], 'pending');
  const isRefreshing =
    shiftsQuery.isRefetching ||
    leaveQuery.isRefetching ||
    overviewQuery.isRefetching ||
    staffQuery.isRefetching;

  const openCreateShift = () => {
    setEditingShift(null);
    setShiftModalVisible(true);
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftModalVisible(true);
  };

  const confirmDeleteShift = (shift: Shift) => {
    Alert.alert('Delete shift', 'Remove this shift from the roster?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteShiftMutation.mutate(shift.id),
      },
    ]);
  };

  const handleShiftSubmit = (input: ShiftInput) => {
    if (editingShift) {
      updateShiftMutation.mutate({ id: editingShift.id, input });
      return;
    }
    createShiftMutation.mutate(input);
  };

  const shiftMutationPending = createShiftMutation.isPending || updateShiftMutation.isPending;
  const shiftMutationError = createShiftMutation.error ?? updateShiftMutation.error;

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ScreenScroll bottomInset={72}>
          <ListScreenSkeleton statsCount={3} cards={4} />
        </ScreenScroll>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">Sign in required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to manage the roster.
        </Text>
      </View>
    );
  }

  const hasLoadError = shiftsQuery.isError || leaveQuery.isError || overviewQuery.isError;
  const loadError =
    (shiftsQuery.error as Error | undefined) ??
    (leaveQuery.error as Error | undefined) ??
    (overviewQuery.error as Error | undefined);

  return (
    <>
      <ScreenScroll
        bottomInset={view === 'shifts' ? 72 : 0}
        refreshing={isRefreshing}
        onRefresh={() => {
          staffQuery.refetch();
          shiftsQuery.refetch();
          leaveQuery.refetch();
          overviewQuery.refetch();
        }}>
        <View className="gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Roster
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            Weekly shifts and leave requests for your team.
          </Text>
        </View>

        <View
          className="flex-row items-center justify-between rounded-3xl border border-border bg-card px-4 py-3"
          style={{ borderCurve: 'continuous' }}>
          <Pressable
            onPress={() => setWeekAnchor((current) => shiftWeek(current, -1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70">
            <Ionicons name="chevron-back" size={20} color="#71717A" />
          </Pressable>

          <View className="items-center gap-1">
            <Text className="text-sm font-medium text-muted-foreground">Week of</Text>
            <Text className="text-base font-semibold text-foreground">{weekLabel}</Text>
          </View>

          <Pressable
            onPress={() => setWeekAnchor((current) => shiftWeek(current, 1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next week"
            className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70">
            <Ionicons name="chevron-forward" size={20} color="#71717A" />
          </Pressable>
        </View>

        {overviewQuery.isLoading ? (
          <StatsRowSkeleton count={3} />
        ) : overviewQuery.data ? (
          <RosterStatsRow overview={overviewQuery.data} />
        ) : null}

        <RosterViewToggle value={view} onChange={setView} />

        {hasLoadError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load roster
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {loadError instanceof Error ? loadError.message : 'Unable to load roster data.'}
              </Text>
            </View>
            <Button
              onPress={() => {
                shiftsQuery.refetch();
                leaveQuery.refetch();
                overviewQuery.refetch();
              }}>
              Try again
            </Button>
          </View>
        ) : null}

        {view === 'shifts' ? (
          <View className="gap-5">
            {shiftsQuery.isLoading ? (
              <CardGridSkeleton />
            ) : (
              shiftGroups.map((group) => (
                <RosterDaySection
                  key={group.dateKey}
                  group={group}
                  onEditShift={openEditShift}
                  onDeleteShift={confirmDeleteShift}
                />
              ))
            )}
          </View>
        ) : (
          <View className="gap-4">
            {leaveQuery.isLoading ? (
              <CardGridSkeleton count={2} />
            ) : pendingLeave.length === 0 ? (
              <View
                className="rounded-3xl border border-border bg-card p-5"
                style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
                <Text className="text-base leading-6 text-muted-foreground">
                  No pending leave requests.
                </Text>
              </View>
            ) : (
              <ResponsiveCardGrid>
                {pendingLeave.map((request) => (
                  <RosterLeaveCard
                    key={request.id}
                    request={request}
                    isUpdating={leaveStatusMutation.isPending}
                    onApprove={() =>
                      leaveStatusMutation.mutate({ id: request.id, status: 'approved' })
                    }
                    onReject={() =>
                      leaveStatusMutation.mutate({ id: request.id, status: 'rejected' })
                    }
                  />
                ))}
              </ResponsiveCardGrid>
            )}
          </View>
        )}
      </ScreenScroll>

      {view === 'shifts' ? (
        <Pressable
          onPress={openCreateShift}
          accessibilityRole="button"
          accessibilityLabel="Add shift"
          hitSlop={8}
          className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
          style={{
            ...fabStyle,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
          }}>
          <Text className="text-3xl font-light leading-none text-primary-foreground">+</Text>
        </Pressable>
      ) : null}

      <RosterShiftModal
        visible={isShiftModalVisible}
        onClose={() => {
          setShiftModalVisible(false);
          setEditingShift(null);
        }}
        onSubmit={handleShiftSubmit}
        isSubmitting={shiftMutationPending}
        errorMessage={
          shiftMutationError instanceof Error ? shiftMutationError.message : null
        }
        staff={staffQuery.data ?? []}
        initialShift={editingShift}
      />
    </>
  );
}
