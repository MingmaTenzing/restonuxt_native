import type { StaffInput, StaffMember } from '@/screens/staff/types';

let staffSeq = 0;

export function makeStaffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  staffSeq += 1;
  return {
    id: overrides.id ?? `staff-${staffSeq}`,
    firstname: overrides.firstname ?? 'Ada',
    lastName: overrides.lastName ?? 'Chef',
    role: overrides.role ?? 'Chef',
    email: overrides.email ?? `ada${staffSeq}@example.com`,
    phone: overrides.phone ?? '+61 400 000 000',
    employmentType: overrides.employmentType ?? 'FullTime',
    perHourRate: overrides.perHourRate ?? 28,
    availability: overrides.availability ?? ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    joined_date: overrides.joined_date ?? '2026-01-15T00:00:00.000Z',
    profile_photo_url:
      overrides.profile_photo_url === undefined ? null : overrides.profile_photo_url,
  };
}

export function makeStaffInput(overrides: Partial<StaffInput> = {}): StaffInput {
  return {
    firstname: overrides.firstname ?? 'Sam',
    lastName: overrides.lastName ?? 'Waiter',
    email: overrides.email ?? 'sam@example.com',
    phone: overrides.phone ?? '+61 411 111 111',
    role: overrides.role ?? 'Waiter',
    perHourRate: overrides.perHourRate ?? 24,
    employmentType: overrides.employmentType ?? 'PartTime',
    availability: overrides.availability ?? ['SAT', 'SUN'],
    ...overrides,
  };
}
