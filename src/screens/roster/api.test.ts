import { afterEach, describe, expect, test } from 'bun:test';

import {
  makeLeaveRequest,
  makeRosterOverview,
  makeShift,
  makeShiftInput,
  makeStaffSummary,
} from '@/test/roster-fixtures';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { testApiClient } from '@/test/test-api-client';
import { apiUrl } from '@/utils/api';

import {
  createLeaveRequest,
  createManyShifts,
  createShift,
  deleteLeaveRequest,
  deleteShift,
  fetchLeaveRequests,
  fetchRosterOverview,
  fetchShift,
  fetchShifts,
  fetchStaff,
  generateRoster,
  updateLeaveStatus,
  updateShift,
} from './api';

describe('roster api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetchStaff GETs /api/staff and unwraps array', async () => {
    const staff = [makeStaffSummary({ id: 's1' }), makeStaffSummary({ id: 's2' })];

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/staff'));
      expect(init?.method ?? 'GET').toBe('GET');
      return jsonResponse(staff);
    });

    const result = await fetchStaff(testApiClient('token'));
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('s1');
  });

  test('fetchStaff unwraps wrapped { staff } payload', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ staff: [makeStaffSummary({ id: 'wrapped' })] })
    );

    const result = await fetchStaff(testApiClient('token'));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('wrapped');
  });

  test('fetchShifts GETs /api/shift with required startDate and endDate', async () => {
    const startDate = '2026-07-13T00:00:00.000Z';
    const endDate = '2026-07-19T23:59:59.999Z';
    const shifts = [makeShift({ id: 'shift-a' })];
    let capturedUrl = '';

    restore = withMockFetch((input, init) => {
      capturedUrl = String(input);
      expect(init?.method ?? 'GET').toBe('GET');
      return jsonResponse(shifts);
    });

    const result = await fetchShifts(testApiClient('token'), startDate, endDate);

    const url = new URL(capturedUrl);
    expect(url.pathname).toBe(new URL(apiUrl('/api/shift')).pathname);
    expect(url.searchParams.get('startDate')).toBe(startDate);
    expect(url.searchParams.get('endDate')).toBe(endDate);
    expect(result[0]?.id).toBe('shift-a');
  });

  test('fetchShifts unwraps { shifts } wrapper', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ shifts: [makeShift({ id: 'wrapped-shift' })] })
    );

    const result = await fetchShifts(
      testApiClient('token'),
      '2026-07-13T00:00:00.000Z',
      '2026-07-19T23:59:59.999Z'
    );
    expect(result[0]?.id).toBe('wrapped-shift');
  });

  test('createShift POSTs body and unwraps { response: Shift }', async () => {
    const input = makeShiftInput({
      staffId: 'staff-9',
      date: '2026-07-16T12:00:00.000Z',
      startTime: '10:00',
      endTime: '18:00',
      position: 'Bar',
    });
    const created = makeShift({ id: 'new-shift', ...input, position: 'Bar' });
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/shift'));
      capturedInit = init;
      return jsonResponse({ response: created });
    });

    const result = await createShift(testApiClient('token'), input);

    expect(result.id).toBe('new-shift');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(input);
  });

  test('createShift omits optional position when undefined', async () => {
    const input = makeShiftInput();
    let capturedBody: unknown;

    restore = withMockFetch((_url, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ response: makeShift({ id: 'no-pos' }) });
    });

    await createShift(testApiClient('token'), input);
    expect(capturedBody).toEqual(input);
    expect((capturedBody as Record<string, unknown>).position).toBeUndefined();
  });

  test('createManyShifts POSTs { data } and returns count', async () => {
    const data = [
      makeShiftInput({ staffId: 'a', startTime: '09:00' }),
      makeShiftInput({ staffId: 'b', startTime: '12:00', position: 'Kitchen' }),
    ];
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/shift/createmany'));
      capturedInit = init;
      return jsonResponse({ response: { count: 2 } });
    });

    const result = await createManyShifts(testApiClient('token'), data);

    expect(result).toEqual({ count: 2 });
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ data });
  });

  test('fetchShift GETs /api/shift/{shiftId}', async () => {
    const shift = makeShift({ id: 'shift-42' });

    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/shift/shift-42'));
      return jsonResponse(shift);
    });

    const result = await fetchShift(testApiClient('token'), 'shift-42');
    expect(result.id).toBe('shift-42');
  });

  test('updateShift PUTs partial fields', async () => {
    let capturedInit: RequestInit | undefined;
    const patch = { startTime: '11:00', endTime: '19:00', position: 'Patio' };

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/shift/shift-7'));
      capturedInit = init;
      return jsonResponse(makeShift({ id: 'shift-7', ...patch }));
    });

    const updated = await updateShift(testApiClient('token'), 'shift-7', patch);

    expect(updated.startTime).toBe('11:00');
    expect(capturedInit?.method).toBe('PUT');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(patch);
  });

  test('deleteShift DELETEs /api/shift/{shiftId}', async () => {
    let capturedInit: RequestInit | undefined;
    const deleted = makeShift({ id: 'shift-gone' });

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/shift/shift-gone'));
      capturedInit = init;
      return jsonResponse(deleted);
    });

    const result = await deleteShift(testApiClient('token'), 'shift-gone');
    expect(result.id).toBe('shift-gone');
    expect(capturedInit?.method).toBe('DELETE');
  });

  test('fetchLeaveRequests GETs /api/leave-requests', async () => {
    const requests = [
      makeLeaveRequest({ id: 'l1', status: 'pending' }),
      makeLeaveRequest({ id: 'l2', status: 'approved' }),
    ];

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/leave-requests'));
      expect(init?.method ?? 'GET').toBe('GET');
      return jsonResponse(requests);
    });

    const result = await fetchLeaveRequests(testApiClient('token'));
    expect(result).toHaveLength(2);
    expect(result[0]?.status).toBe('pending');
  });

  test('createLeaveRequest POSTs leave body', async () => {
    const input = {
      staffId: 'staff-3',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-03T00:00:00.000Z',
      reason: 'Medical',
    };
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/leave-requests'));
      capturedInit = init;
      return jsonResponse(makeLeaveRequest({ id: 'leave-new', ...input, status: 'pending' }));
    });

    const created = await createLeaveRequest(testApiClient('token'), input);

    expect(created.id).toBe('leave-new');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(input);
  });

  test('updateLeaveStatus PUTs { status } only', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/leave-requests/leave-9'));
      capturedInit = init;
      return jsonResponse(makeLeaveRequest({ id: 'leave-9', status: 'approved' }));
    });

    const updated = await updateLeaveStatus(testApiClient('token'), 'leave-9', 'approved');

    expect(updated.status).toBe('approved');
    expect(capturedInit?.method).toBe('PUT');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ status: 'approved' });
  });

  test('updateLeaveStatus can reject', async () => {
    restore = withMockFetch((_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({ status: 'rejected' });
      return jsonResponse(makeLeaveRequest({ id: 'leave-rej', status: 'rejected' }));
    });

    const updated = await updateLeaveStatus(testApiClient('token'), 'leave-rej', 'rejected');
    expect(updated.status).toBe('rejected');
  });

  test('deleteLeaveRequest DELETEs /api/leave-requests/{id}', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/leave-requests/leave-del'));
      capturedInit = init;
      return jsonResponse(makeLeaveRequest({ id: 'leave-del' }));
    });

    const result = await deleteLeaveRequest(testApiClient('token'), 'leave-del');
    expect(result.id).toBe('leave-del');
    expect(capturedInit?.method).toBe('DELETE');
  });

  test('fetchRosterOverview GETs stats with week range query', async () => {
    const startDate = '2026-07-13T00:00:00.000Z';
    const endDate = '2026-07-19T23:59:59.999Z';
    const overview = makeRosterOverview({ startDate, endDate, weeklyShiftCount: 12 });
    let capturedUrl = '';

    restore = withMockFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse(overview);
    });

    const result = await fetchRosterOverview(testApiClient('token'), startDate, endDate);

    const url = new URL(capturedUrl);
    expect(url.pathname).toBe(
      new URL(apiUrl('/api/dashboard/stats/roster-overview')).pathname
    );
    expect(url.searchParams.get('startDate')).toBe(startDate);
    expect(url.searchParams.get('endDate')).toBe(endDate);
    expect(result.weeklyShiftCount).toBe(12);
    expect(result.totalStaff).toBe(8);
  });

  test('generateRoster POSTs optional message and returns agent plan', async () => {
    const agentShifts = [
      {
        staffId: 'staff-1',
        date: '2026-07-15T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        position: 'Waiter',
      },
    ];
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/roster-agent'));
      capturedInit = init;
      return jsonResponse({
        shifts: agentShifts,
        assistantMessage: { content: 'Draft ready', caution: 'Review coverage' },
      });
    });

    const result = await generateRoster(testApiClient('token'), 'Cover Friday dinner');

    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      message: 'Cover Friday dinner',
    });
    expect(result.shifts).toEqual(agentShifts);
    expect(result.assistantMessage.content).toBe('Draft ready');
  });

  test('generateRoster allows empty body when message omitted', async () => {
    restore = withMockFetch((_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({});
      return jsonResponse({
        shifts: [],
        assistantMessage: { content: '', caution: '' },
      });
    });

    const result = await generateRoster(testApiClient('token'));
    expect(result.shifts).toEqual([]);
  });

  test('agent shifts can be fed into createManyShifts', async () => {
    const agentShifts = [
      {
        staffId: 's1',
        date: '2026-07-15T00:00:00.000Z',
        startTime: '09:00',
        endTime: '17:00',
        position: 'Chef',
      },
    ];

    restore = withMockFetch((inputUrl, init) => {
      if (String(inputUrl) === apiUrl('/api/roster-agent')) {
        return jsonResponse({
          shifts: agentShifts,
          assistantMessage: { content: 'ok', caution: '' },
        });
      }
      expect(String(inputUrl)).toBe(apiUrl('/api/shift/createmany'));
      expect(JSON.parse(String(init?.body))).toEqual({ data: agentShifts });
      return jsonResponse({ response: { count: 1 } });
    });

    const plan = await generateRoster(testApiClient('token'), 'Weekend roster');
    const saved = await createManyShifts(testApiClient('token'), plan.shifts);
    expect(saved.count).toBe(1);
  });

  test('propagates shift API error messages', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ statusMessage: 'startDate and endDate are required' }, 400)
    );

    await expect(
      fetchShifts(testApiClient('token'), '', '')
    ).rejects.toThrow('startDate and endDate are required');
  });

  test('propagates leave update failures', async () => {
    restore = withMockFetch(() => jsonResponse({ message: 'Leave request not found' }, 404));

    await expect(updateLeaveStatus(testApiClient('token'), 'missing', 'approved')).rejects.toThrow(
      'Leave request not found'
    );
  });
});
