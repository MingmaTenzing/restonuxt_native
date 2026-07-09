import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { Image, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';
import { formatDate } from '@/utils/format-date';

const STAFF_API_URL = apiUrl('/api/staff');

// Types mirror the RestoQuick API contract (see API_REFERENCE.md → Staff / Enums).
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
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-neutral-900 dark:text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <View
      className="gap-4 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center gap-4">
        {member.profile_photo_url ? (
          <Image source={{ uri: member.profile_photo_url }} className="h-14 w-14 rounded-full" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-accent/15">
            <Text className="text-lg font-bold text-accent dark:text-accent-dark">
              {getInitials(member.firstname, member.lastName)}
            </Text>
          </View>
        )}

        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {member.firstname} {member.lastName}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-accent/15 px-3 py-1">
              <Text className="text-xs font-semibold text-accent dark:text-accent-dark">
                {formatLabel(member.role)}
              </Text>
            </View>
            <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {formatLabel(member.employmentType)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="h-px bg-neutral-100 dark:bg-neutral-800" />

      <View className="gap-3">
        <DetailRow label="Email" value={member.email} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Rate" value={`$${member.perHourRate}/hr`} />
        <DetailRow label="Joined" value={formatDate(member.joined_date)} />
      </View>

      {member.availability?.length ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Availability
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {member.availability.map((day) => (
              <View
                key={day}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
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
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 dark:bg-black">
        <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 dark:bg-black">
        <Text className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-neutral-500 dark:text-neutral-400">
          Sign in from the Home tab to view staff members.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Staff</Text>
        <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
          {isLoading ? 'Loading staff members...' : `${staff.length} staff members`}
        </Text>
      </View>

      {isError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
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
          className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
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
