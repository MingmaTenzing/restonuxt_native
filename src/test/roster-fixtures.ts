import type {
  LeaveRequest,
  RosterOverview,
  Shift,
  ShiftInput,
  StaffSummary,
} from '@/screens/roster/types';

let staffSeq = 0;
let shiftSeq = 0;
let leaveSeq = 0;

export function makeStaffSummary(overrides: Partial<StaffSummary> = {}): StaffSummary {
  staffSeq += 1;
  return {
    id: overrides.id ?? `staff-${staffSeq}`,
    firstname: overrides.firstname ?? 'Ada',
    lastName: overrides.lastName ?? 'Chef',
    role: overrides.role ?? 'Chef',
    profile_photo_url: overrides.profile_photo_url === undefined ? null : overrides.profile_photo_url,
  };
}

export function makeShift(overrides: Partial<Shift> = {}): Shift {
  shiftSeq += 1;
  const staff = overrides.staff ?? makeStaffSummary({ id: overrides.staffId ?? `staff-${shiftSeq}` });
  return {
    id: overrides.id ?? `shift-${shiftSeq}`,
    staffId: overrides.staffId ?? staff.id,
    date: overrides.date ?? '2026-07-15T00:00:00.000Z',
    startTime: overrides.startTime ?? '09:00',
    endTime: overrides.endTime ?? '17:00',
    position: overrides.position ?? 'Floor',
    staff: overrides.staff === undefined ? staff : overrides.staff,
  };
}

export function makeShiftInput(overrides: Partial<ShiftInput> = {}): ShiftInput {
  return {
    staffId: overrides.staffId ?? 'staff-1',
    date: overrides.date ?? '2026-07-15T12:00:00.000Z',
    startTime: overrides.startTime ?? '09:00',
    endTime: overrides.endTime ?? '17:00',
    ...(overrides.position !== undefined ? { position: overrides.position } : {}),
  };
}

export function makeLeaveRequest(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  leaveSeq += 1;
  const staff =
    overrides.staff ?? makeStaffSummary({ id: overrides.staffId ?? `staff-leave-${leaveSeq}` });
  return {
    id: overrides.id ?? `leave-${leaveSeq}`,
    staffId: overrides.staffId ?? staff.id,
    startDate: overrides.startDate ?? '2026-07-20T00:00:00.000Z',
    endDate: overrides.endDate ?? '2026-07-22T00:00:00.000Z',
    reason: overrides.reason ?? 'Family holiday',
    status: overrides.status ?? 'pending',
    submittedAt: overrides.submittedAt ?? '2026-07-10T08:00:00.000Z',
    staff: overrides.staff === undefined ? staff : overrides.staff,
  };
}

export function makeRosterOverview(overrides: Partial<RosterOverview> = {}): RosterOverview {
  return {
    totalStaff: overrides.totalStaff ?? 8,
    weeklyShiftCount: overrides.weeklyShiftCount ?? 24,
    pendingLeaveRequests: overrides.pendingLeaveRequests ?? 2,
    startDate: overrides.startDate ?? '2026-07-13T00:00:00.000Z',
    endDate: overrides.endDate ?? '2026-07-19T23:59:59.999Z',
  };
}
