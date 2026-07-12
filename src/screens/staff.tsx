import { useQuery } from '@tanstack/react-query';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { ApiClient } from '@/utils/api';
import { unwrapList } from '@/utils/api';
import { formatDate } from '@/utils/format-date';

// Types mirror the RestoQuick API contract (see RESTOQUICK_DOC.md → Staff / Enums).
type Role = 'Chef' | 'Waiter' | 'Bartender' | 'Manager' | 'Cook' | 'Kitchen_Hand';
type EmploymentType = 'PartTime' | 'FullTime' | 'Casual';
type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface StaffMember {
  id: string;
  firstname: string;
  lastName: string;
  role: Role;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  perHourRate: number | string; // Prisma Decimal, serialized as string/number
  availability: WeekDay[];
  joined_date: string;
  profile_photo_url: string | null;
}

// "Kitchen_Hand" -> "Kitchen Hand", "PartTime" -> "Part Time"
function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

async function fetchStaff(api: ApiClient): Promise<StaffMember[]> {
  const payload = await api<unknown>('/api/staff');
  return unwrapList<StaffMember>(payload, ['staff', 'data']);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-medium text-muted-foreground">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-foreground">
        {value}
      </Text>
    </View>
  );
}

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-center gap-4">
        {member.profile_photo_url ? (
          <Image source={{ uri: member.profile_photo_url }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-lg font-bold text-primary">
              {getInitials(member.firstname, member.lastName)}
            </Text>
          </View>
        )}

        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-foreground">
            {member.firstname} {member.lastName}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-semibold text-primary">
                {formatLabel(member.role)}
              </Text>
            </View>
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {formatLabel(member.employmentType)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="h-px bg-muted" />

      <View className="gap-3">
        <DetailRow label="Email" value={member.email} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Rate" value={`$${member.perHourRate}/hr`} />
        <DetailRow label="Joined" value={formatDate(member.joined_date)} />
      </View>

      {member.availability?.length ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Availability
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {member.availability.map((day) => (
              <View
                key={day}
                className="rounded-xl border border-border bg-muted px-3 py-1.5">
                <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function StaffScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const { isTablet } = useResponsiveLayout();

  const {
    data: staff = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['staff'],
    enabled: isReady,
    queryFn: () => fetchStaff(api),
  });

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-base font-medium text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to view staff members.
        </Text>
      </View>
    );
  }

  return (
    <ScreenScroll refreshing={isFetching} onRefresh={() => refetch()}>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          Staff
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          {isLoading ? 'Loading staff members...' : `${staff.length} staff members`}
        </Text>
      </View>

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
            No staff members found.
          </Text>
        </View>
      ) : null}

      <ResponsiveCardGrid>
        {staff.map((member) => (
          <StaffCard key={member.id} member={member} />
        ))}
      </ResponsiveCardGrid>
    </ScreenScroll>
  );
}
