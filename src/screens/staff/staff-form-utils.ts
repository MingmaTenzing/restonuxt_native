import type { EmploymentType, Role, StaffInput, StaffUpdateInput, WeekDay } from './types';

export interface StaffFormDraft {
  firstname: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  employmentType: EmploymentType;
  perHourRate: string;
  availability: WeekDay[];
  profilePhotoUrl: string;
}

export type StaffFormResult =
  | { ok: true; input: StaffInput }
  | { ok: false; error: string };

export type StaffUpdateFormResult =
  | { ok: true; input: StaffUpdateInput }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parsePerHourRate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function validateStaffForm(draft: StaffFormDraft): StaffFormResult {
  const firstname = draft.firstname.trim();
  const lastName = draft.lastName.trim();
  const email = draft.email.trim();
  const phone = draft.phone.trim();
  const perHourRate = parsePerHourRate(draft.perHourRate);

  if (!firstname) return { ok: false, error: 'First name is required.' };
  if (!lastName) return { ok: false, error: 'Last name is required.' };
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  if (!phone) return { ok: false, error: 'Phone number is required.' };
  if (perHourRate === null) return { ok: false, error: 'Enter a valid hourly rate.' };

  return {
    ok: true,
    input: {
      firstname,
      lastName,
      email,
      phone,
      role: draft.role,
      perHourRate,
      employmentType: draft.employmentType,
      ...(draft.availability.length ? { availability: draft.availability } : {}),
    },
  };
}

export function validateStaffUpdateForm(draft: StaffFormDraft): StaffUpdateFormResult {
  const result = validateStaffForm(draft);
  if (!result.ok) return result;

  const profilePhotoUrl = draft.profilePhotoUrl.trim();

  return {
    ok: true,
    input: {
      ...result.input,
      profile_photo_url: profilePhotoUrl || null,
    },
  };
}

export function toggleWeekDay(days: WeekDay[], day: WeekDay): WeekDay[] {
  return days.includes(day) ? days.filter((value) => value !== day) : [...days, day];
}
