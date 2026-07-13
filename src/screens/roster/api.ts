import { unwrapList, type ApiClient } from '@/utils/api';

import type {
  LeaveRequest,
  LeaveStatus,
  RosterOverview,
  Shift,
  ShiftInput,
  StaffSummary,
} from './types';

export async function fetchStaff(api: ApiClient): Promise<StaffSummary[]> {
  const payload = await api<unknown>('/api/staff');
  return unwrapList<StaffSummary>(payload, ['staff', 'data']);
}

/** GET /api/shift?startDate&endDate — both query params required (ISO). */
export async function fetchShifts(
  api: ApiClient,
  startDate: string,
  endDate: string
): Promise<Shift[]> {
  const params = new URLSearchParams({ startDate, endDate });
  const payload = await api<unknown>(`/api/shift?${params}`);
  return unwrapList<Shift>(payload, ['shifts', 'data']);
}

/** POST /api/shift — response is `{ response: Shift }` per API contract. */
export async function createShift(api: ApiClient, input: ShiftInput): Promise<Shift> {
  const payload = await api<{ response: Shift }>('/api/shift', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.response;
}

/** POST /api/shift/createmany — bulk create (e.g. from roster-agent). */
export async function createManyShifts(
  api: ApiClient,
  shifts: ShiftInput[]
): Promise<{ count: number }> {
  const payload = await api<{ response: { count: number } }>('/api/shift/createmany', {
    method: 'POST',
    body: JSON.stringify({ data: shifts }),
  });
  return payload.response;
}

export async function fetchShift(api: ApiClient, shiftId: string): Promise<Shift> {
  return api<Shift>(`/api/shift/${shiftId}`);
}

export async function updateShift(
  api: ApiClient,
  shiftId: string,
  input: Partial<ShiftInput>
): Promise<Shift> {
  return api<Shift>(`/api/shift/${shiftId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteShift(api: ApiClient, shiftId: string): Promise<Shift> {
  return api<Shift>(`/api/shift/${shiftId}`, {
    method: 'DELETE',
  });
}

export async function fetchLeaveRequests(api: ApiClient): Promise<LeaveRequest[]> {
  const payload = await api<unknown>('/api/leave-requests');
  return unwrapList<LeaveRequest>(payload, ['leaveRequests', 'data']);
}

export async function createLeaveRequest(
  api: ApiClient,
  input: {
    staffId: string;
    startDate: string;
    endDate: string;
    reason: string;
    status?: LeaveStatus;
  }
): Promise<LeaveRequest> {
  return api<LeaveRequest>('/api/leave-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLeaveStatus(
  api: ApiClient,
  requestId: string,
  status: LeaveStatus
): Promise<LeaveRequest> {
  return api<LeaveRequest>(`/api/leave-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteLeaveRequest(
  api: ApiClient,
  requestId: string
): Promise<LeaveRequest> {
  return api<LeaveRequest>(`/api/leave-requests/${requestId}`, {
    method: 'DELETE',
  });
}

/** GET /api/dashboard/stats/roster-overview?startDate&endDate */
export async function fetchRosterOverview(
  api: ApiClient,
  startDate: string,
  endDate: string
): Promise<RosterOverview> {
  const params = new URLSearchParams({ startDate, endDate });
  return api<RosterOverview>(`/api/dashboard/stats/roster-overview?${params}`);
}

export interface RosterAgentShift {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
}

export interface RosterAgentResponse {
  shifts: RosterAgentShift[];
  assistantMessage: {
    content: string;
    caution: string;
  };
}

/** POST /api/roster-agent — AI shift plan; feed `shifts` into createManyShifts. */
export async function generateRoster(
  api: ApiClient,
  message?: string
): Promise<RosterAgentResponse> {
  return api<RosterAgentResponse>('/api/roster-agent', {
    method: 'POST',
    body: JSON.stringify(message !== undefined ? { message } : {}),
  });
}
