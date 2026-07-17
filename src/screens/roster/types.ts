export type Role =
  | 'Chef'
  | 'Waiter'
  | 'Bartender'
  | 'Manager'
  | 'Cook'
  | 'Kitchen_Hand';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface StaffSummary {
  id: string;
  firstname: string;
  lastName: string;
  role: Role;
  profile_photo_url: string | null;
}

export interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  staff?: StaffSummary;
}

export interface ShiftInput {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  position?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  staff?: StaffSummary;
}

export interface RosterOverview {
  totalStaff: number;
  weeklyShiftCount: number;
  pendingLeaveRequests: number;
  startDate: string;
  endDate: string;
}

export type RosterView = 'shifts' | 'leave';
