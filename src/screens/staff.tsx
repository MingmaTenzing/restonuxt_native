import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { SafeAreaView } from 'react-native-safe-area-context';

const STAFF_API_URL = 'https://restoquicknuxt-production.up.railway.app/api/staff';

type StaffMember = Record<string, unknown>;

type FetchState =
  | { status: 'idle' | 'loading'; data: StaffMember[]; error: null }
  | { status: 'success'; data: StaffMember[]; error: null }
  | { status: 'error'; data: StaffMember[]; error: string };

function getStringValue(member: StaffMember, keys: string[]) {
  for (const key of keys) {
    const value = member[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return null;
}

function getStaffName(member: StaffMember) {
  const directName = getStringValue(member, ['name', 'fullName', 'displayName', 'username']);

  if (directName) {
    return directName;
  }

  const firstName = getStringValue(member, ['firstName', 'first_name']);
  const lastName = getStringValue(member, ['lastName', 'last_name']);
  const name = [firstName, lastName].filter(Boolean).join(' ');

  return name || getStringValue(member, ['email', 'phone']) || 'Staff member';
}

function getStaffMembers(payload: unknown): StaffMember[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is StaffMember => item !== null && typeof item === 'object');
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const possibleKeys = [
    'staff',
    'staffMembers',
    'members',
    'employees',
    'users',
    'data',
    'items',
    'results',
  ];

  for (const key of possibleKeys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.filter((item): item is StaffMember => item !== null && typeof item === 'object');
    }
  }

  return [];
}

async function fetchStaffMembers(token: string) {
  const response = await fetch(STAFF_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `Unable to load staff (${response.status})`;

    throw new Error(message);
  }

  return getStaffMembers(payload);
}

export default function StaffScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  const [fetchKey, setFetchKey] = useState(0);
  const [state, setState] = useState<FetchState>({ status: 'idle', data: [], error: null });

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const abortController = new AbortController();

    setState((current) => ({ status: 'loading', data: current.data, error: null }));

    async function loadStaff() {
      try {
        const token = await getTokenRef.current();

        if (!token) {
          throw new Error('Sign in again to load staff.');
        }

        const data = await fetchStaffMembers(token);

        if (!abortController.signal.aborted) {
          setState({ status: 'success', data, error: null });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState({
            status: 'error',
            data: [],
            error: error instanceof Error ? error.message : 'Unable to load staff.',
          });
        }
      }
    }

    loadStaff();

    return () => {
      abortController.abort();
    };
  }, [fetchKey, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50 px-5">
        <Text className="text-base font-medium text-zinc-600">Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50 px-5">
        <Text className="text-center text-xl font-semibold text-zinc-950">Sign in required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-zinc-600">
          Sign in from the Home tab to view staff members.
        </Text>
      </View>
    );
  }

  const isLoading = state.status === 'loading';

  return (
    <ScrollView
      className="flex-1 bg-zinc-50"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-zinc-950">Staff</Text>
        <Text className="text-base leading-6 text-zinc-600">
          {isLoading ? 'Loading staff members...' : `${state.data.length} staff members`}
        </Text>
      </View>

      {state.status === 'error' ? (
        <View className="gap-4 rounded-3xl border border-red-200 bg-red-50 p-5">
          <View className="gap-2">
            <Text className="text-lg font-semibold text-red-950">Could not load staff</Text>
            <Text className="text-base leading-6 text-red-700">{state.error}</Text>
          </View>
          <Button onPress={() => setFetchKey((key) => key + 1)}>Try again</Button>
        </View>
      ) : null}

      {state.status === 'success' && state.data.length === 0 ? (
        <View className="rounded-3xl border border-zinc-200 bg-white p-5">
          <Text className="text-base leading-6 text-zinc-600">No staff members found.</Text>
        </View>
      ) : null}

      <View className="gap-3">
        {state.data.map((member, index) => {
          const name = getStaffName(member);
          const role = getStringValue(member, [
            'role',
            'position',
            'jobTitle',
            'job_title',
            'title',
          ]);
          const email = getStringValue(member, ['email', 'emailAddress', 'email_address']);
          const phone = getStringValue(member, ['phone', 'phoneNumber', 'phone_number']);
          const key =
            getStringValue(member, ['id', '_id', 'staffId', 'staff_id']) ?? `${name}-${index}`;

          return (
            <View key={key} className="gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
              <View className="gap-1">
                <Text className="text-lg font-semibold text-zinc-950">{name}</Text>
                {role ? <Text className="text-sm font-medium text-zinc-500">{role}</Text> : null}
              </View>

              {email || phone ? (
                <View className="gap-1">
                  {email ? <Text className="text-base text-zinc-700">{email}</Text> : null}
                  {phone ? <Text className="text-base text-zinc-700">{phone}</Text> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
