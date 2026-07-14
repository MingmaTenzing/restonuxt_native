import { describe, expect, test } from 'bun:test';

import {
  toggleWeekDay,
  validateStaffForm,
  validateStaffUpdateForm,
} from './staff-form-utils';

const validDraft = {
  firstname: 'Jane',
  lastName: 'Doe',
  email: 'jane@restaurant.com',
  phone: '+61 400 000 000',
  role: 'Waiter' as const,
  employmentType: 'FullTime' as const,
  perHourRate: '25.50',
  availability: ['MON', 'WED'] as const,
  profilePhotoUrl: '',
};

describe('validateStaffForm', () => {
  test('accepts a valid draft', () => {
    const result = validateStaffForm(validDraft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.input).toEqual({
      firstname: 'Jane',
      lastName: 'Doe',
      email: 'jane@restaurant.com',
      phone: '+61 400 000 000',
      role: 'Waiter',
      perHourRate: 25.5,
      employmentType: 'FullTime',
      availability: ['MON', 'WED'],
    });
  });

  test('rejects missing first name', () => {
    const result = validateStaffForm({ ...validDraft, firstname: '  ' });
    expect(result).toEqual({ ok: false, error: 'First name is required.' });
  });

  test('rejects invalid email', () => {
    const result = validateStaffForm({ ...validDraft, email: 'not-an-email' });
    expect(result).toEqual({ ok: false, error: 'Enter a valid email address.' });
  });

  test('rejects invalid hourly rate', () => {
    const result = validateStaffForm({ ...validDraft, perHourRate: '-1' });
    expect(result).toEqual({ ok: false, error: 'Enter a valid hourly rate.' });
  });

  test('omits availability when none selected', () => {
    const result = validateStaffForm({ ...validDraft, availability: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.availability).toBeUndefined();
  });
});

describe('validateStaffUpdateForm', () => {
  test('includes profile photo url on update', () => {
    const result = validateStaffUpdateForm({
      ...validDraft,
      profilePhotoUrl: 'https://cdn.example.com/jane.jpg',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.profile_photo_url).toBe('https://cdn.example.com/jane.jpg');
  });

  test('clears profile photo url when blank', () => {
    const result = validateStaffUpdateForm(validDraft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.profile_photo_url).toBeNull();
  });
});

describe('toggleWeekDay', () => {
  test('adds a day when not selected', () => {
    expect(toggleWeekDay(['MON'], 'TUE')).toEqual(['MON', 'TUE']);
  });

  test('removes a day when already selected', () => {
    expect(toggleWeekDay(['MON', 'TUE'], 'MON')).toEqual(['TUE']);
  });
});
