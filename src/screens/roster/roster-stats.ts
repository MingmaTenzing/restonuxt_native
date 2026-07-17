import { formatDayLabel, toDateKey, weekDayKeys } from './roster-week';
import type { LeaveRequest, Shift } from './types';

export interface ShiftDayGroup {
  dateKey: string;
  label: string;
  shifts: Shift[];
}

export function groupShiftsByDay(shifts: Shift[], weekStart: Date): ShiftDayGroup[] {
  const buckets = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const key = toDateKey(shift.date);
    const list = buckets.get(key) ?? [];
    list.push(shift);
    buckets.set(key, list);
  }

  return weekDayKeys(weekStart).map((dateKey) => ({
    dateKey,
    label: formatDayLabel(dateKey),
    shifts: (buckets.get(dateKey) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
}

export function filterLeaveRequests(
  requests: LeaveRequest[],
  status: 'pending' | 'all'
): LeaveRequest[] {
  if (status === 'all') return requests;
  return requests.filter((request) => request.status === 'pending');
}

export function staffDisplayName(staff?: { firstname: string; lastName: string }) {
  if (!staff) return 'Unknown staff';
  return `${staff.firstname} ${staff.lastName}`.trim();
}
