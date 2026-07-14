import { unwrapList, type ApiClient } from '@/utils/api';

import type { StaffInput, StaffMember, StaffUpdateInput } from './types';

export async function fetchStaff(api: ApiClient, staffName?: string): Promise<StaffMember[]> {
  const query = staffName?.trim();
  const path = query ? `/api/staff?${new URLSearchParams({ staff_name: query })}` : '/api/staff';
  const payload = await api<unknown>(path);
  return unwrapList<StaffMember>(payload, ['staff', 'data']);
}

export async function fetchStaffMember(api: ApiClient, staffId: string): Promise<StaffMember> {
  return api<StaffMember>(`/api/staff/${staffId}`);
}

export async function createStaff(api: ApiClient, input: StaffInput): Promise<StaffMember> {
  return api<StaffMember>('/api/staff', {
    method: 'POST',
    body: JSON.stringify({ staff: input }),
  });
}

export async function updateStaff(
  api: ApiClient,
  staffId: string,
  input: StaffUpdateInput
): Promise<StaffMember> {
  return api<StaffMember>(`/api/staff/${staffId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteStaff(api: ApiClient, staffId: string): Promise<StaffMember> {
  return api<StaffMember>(`/api/staff/${staffId}`, {
    method: 'DELETE',
  });
}
