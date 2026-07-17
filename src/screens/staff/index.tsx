import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { CardGridSkeleton, ListScreenSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { createStaff, deleteStaff, fetchStaff, updateStaff } from './api';
import { StaffCard } from './staff-card';
import { StaffFormModal } from './staff-form-modal';
import type { StaffInput, StaffMember, StaffUpdateInput } from './types';

function filterStaffLocally(staff: StaffMember[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return staff;
  return staff.filter((member) => {
    const fullName = `${member.firstname} ${member.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.phone.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q)
    );
  });
}

export default function StaffScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const { isTablet, fabStyle } = useResponsiveLayout();

  const [query, setQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const {
    data: staff = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['staff'],
    enabled: isReady,
    queryFn: () => fetchStaff(api),
  });

  const invalidateStaff = () => queryClient.invalidateQueries({ queryKey: ['staff'] });

  const saveMutation = useMutation({
    mutationFn: async (input: StaffInput | StaffUpdateInput) => {
      if (editingMember) {
        return updateStaff(api, editingMember.id, input as StaffUpdateInput);
      }
      return createStaff(api, input as StaffInput);
    },
    onSuccess: () => {
      invalidateStaff();
      setModalVisible(false);
      setEditingMember(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (member: StaffMember) => deleteStaff(api, member.id),
    onSuccess: () => {
      invalidateStaff();
      setModalVisible(false);
      setEditingMember(null);
    },
  });

  const visibleStaff = useMemo(() => filterStaffLocally(staff, query), [staff, query]);

  const openAdd = () => {
    setEditingMember(null);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingMember(member);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const confirmDelete = (member: StaffMember) => {
    Alert.alert(
      'Delete staff member',
      `Remove ${member.firstname} ${member.lastName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(member),
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ScreenScroll bottomInset={72}>
          <ListScreenSkeleton cards={4} />
        </ScreenScroll>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">Sign in required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to manage staff.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScreenScroll bottomInset={72} refreshing={isRefetching} onRefresh={() => refetch()}>
        <View className="gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Staff
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading staff members...'
              : `${staff.length} ${staff.length === 1 ? 'member' : 'members'}`}
          </Text>
        </View>

        {!isError ? (
          <View
            className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name"
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              className="flex-1 text-base text-foreground"
            />
          </View>
        ) : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load staff
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load staff.'}
              </Text>
            </View>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {!isLoading && !isError && staff.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No staff members yet. Tap + to add your first team member.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && staff.length > 0 && visibleStaff.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No staff members match your search.
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <CardGridSkeleton />
        ) : (
          <ResponsiveCardGrid>
            {visibleStaff.map((member) => (
              <StaffCard key={member.id} member={member} onPress={() => openEdit(member)} />
            ))}
          </ResponsiveCardGrid>
        )}
      </ScreenScroll>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add staff member"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{
          ...fabStyle,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <StaffFormModal
        visible={isModalVisible}
        member={editingMember}
        onClose={() => {
          setModalVisible(false);
          setEditingMember(null);
        }}
        onSubmit={(input) => saveMutation.mutate(input)}
        onDelete={confirmDelete}
        isSubmitting={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
        errorMessage={
          saveMutation.isError
            ? (saveMutation.error as Error).message
            : deleteMutation.isError
              ? (deleteMutation.error as Error).message
              : null
        }
      />
    </>
  );
}
