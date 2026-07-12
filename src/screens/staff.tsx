import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { Image, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';
import { formatDate } from '@/utils/format-date';

const STAFF_API_URL = apiUrl('/api/staff');

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

async function fetchStaff(token: string): Promise<StaffMember[]> {
  const response = await fetch(STAFF_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Unable to load staff (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.staff ?? payload.data ?? []);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-foreground dark:text-foreground-dark">
        {value}
      </Text>
    </View>
  );
}

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-center gap-4">
        {member.profile_photo_url ? (
          <Image source={{ uri: member.profile_photo_url }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-dark/15">
            <Text className="text-lg font-bold text-primary dark:text-primary-dark">
              {getInitials(member.firstname, member.lastName)}
            </Text>
          </View>
        )}

        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {member.firstname} {member.lastName}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-primary/10 px-3 py-1 dark:bg-primary-dark/15">
              <Text className="text-xs font-semibold text-primary dark:text-primary-dark">
                {formatLabel(member.role)}
              </Text>
            </View>
            <View className="rounded-full bg-muted px-3 py-1 dark:bg-muted-dark">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {formatLabel(member.employmentType)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="h-px bg-muted dark:bg-muted-dark" />

      <View className="gap-3">
        <DetailRow label="Email" value={member.email} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Rate" value={`$${member.perHourRate}/hr`} />
        <DetailRow label="Joined" value={formatDate(member.joined_date)} />
      </View>

      {member.availability?.length ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
            Availability
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {member.availability.map((day) => (
              <View
                key={day}
                className="rounded-xl border border-border bg-muted px-3 py-1.5 dark:border-border-dark dark:bg-muted-dark">
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
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const {
    data: staff = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in again to load staff.');
      return fetchStaff(token);
    },
  });

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
          Sign in from the Home tab to view staff members.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Staff
        </Text>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
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
          className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
          style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            No staff members found.
          </Text>
        </View>
      ) : null}

      <View className="gap-3">
        {staff.map((member) => (
          <StaffCard key={member.id} member={member} />
        ))}
      </View>
    </ScrollView>
  );
}
