import { afterEach, describe, expect, test } from 'bun:test';

import { makeStaffInput, makeStaffMember } from '@/test/staff-fixtures';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { testApiClient } from '@/test/test-api-client';
import { apiUrl } from '@/utils/api';

import {
  createStaff,
  deleteStaff,
  fetchStaff,
  fetchStaffMember,
  updateStaff,
} from './api';

describe('staff api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetchStaff GETs /api/staff and unwraps array', async () => {
    const staff = [makeStaffMember({ id: 's1' }), makeStaffMember({ id: 's2' })];

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/staff'));
      expect(init?.method ?? 'GET').toBe('GET');
      return jsonResponse(staff);
    });

    const result = await fetchStaff(testApiClient('token'));
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('s1');
  });

  test('fetchStaff supports staff_name query', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/staff?staff_name=ada'));
      return jsonResponse([makeStaffMember({ firstname: 'Ada' })]);
    });

    const result = await fetchStaff(testApiClient('token'), 'ada');
    expect(result).toHaveLength(1);
    expect(result[0]?.firstname).toBe('Ada');
  });

  test('fetchStaffMember GETs /api/staff/{id}', async () => {
    const member = makeStaffMember({ id: 'staff-9' });

    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/staff/staff-9'));
      return jsonResponse(member);
    });

    const result = await fetchStaffMember(testApiClient('token'), 'staff-9');
    expect(result.id).toBe('staff-9');
  });

  test('createStaff POSTs wrapped staff body', async () => {
    const input = makeStaffInput({ firstname: 'Mia', lastName: 'Cook' });
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/staff'));
      capturedInit = init;
      return jsonResponse(makeStaffMember({ id: 'created-1', ...input }));
    });

    const created = await createStaff(testApiClient('token'), input);

    expect(created.id).toBe('created-1');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ staff: input });
  });

  test('updateStaff PATCHes partial fields', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/staff/staff-3'));
      capturedInit = init;
      return jsonResponse(makeStaffMember({ id: 'staff-3', perHourRate: 32 }));
    });

    const updated = await updateStaff(testApiClient('token'), 'staff-3', { perHourRate: 32 });

    expect(updated.perHourRate).toBe(32);
    expect(capturedInit?.method).toBe('PATCH');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ perHourRate: 32 });
  });

  test('deleteStaff DELETEs /api/staff/{id}', async () => {
    let capturedInit: RequestInit | undefined;
    const deleted = makeStaffMember({ id: 'staff-gone' });

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/staff/staff-gone'));
      capturedInit = init;
      return jsonResponse(deleted);
    });

    const result = await deleteStaff(testApiClient('token'), 'staff-gone');

    expect(result.id).toBe('staff-gone');
    expect(capturedInit?.method).toBe('DELETE');
  });

  test('propagates API error messages', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ statusMessage: 'Staff member not found' }, 404)
    );

    await expect(fetchStaffMember(testApiClient('token'), 'missing')).rejects.toThrow(
      'Staff member not found'
    );
  });
});
