import type { Role } from '@/screens/roster/types';

export type { Role };

export type EmploymentType = 'PartTime' | 'FullTime' | 'Casual';

export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface StaffMember {
  id: string;
  firstname: string;
  lastName: string;
  role: Role;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  perHourRate: number | string;
  availability: WeekDay[];
  joined_date: string;
  profile_photo_url: string | null;
}

export interface StaffInput {
  firstname: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  perHourRate: number;
  employmentType?: EmploymentType;
  availability?: WeekDay[];
  profile_photo_url?: string;
}

export interface StaffUpdateInput {
  firstname?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: Role;
  perHourRate?: number;
  employmentType?: EmploymentType;
  availability?: WeekDay[];
  profile_photo_url?: string | null;
}

export const ROLES: Role[] = ['Chef', 'Waiter', 'Bartender', 'Manager', 'Cook', 'Kitchen_Hand'];

export const EMPLOYMENT_TYPES: EmploymentType[] = ['FullTime', 'PartTime', 'Casual'];

export const WEEK_DAYS: WeekDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ROLE_LABELS: Record<Role, string> = {
  Chef: 'Chef',
  Waiter: 'Waiter',
  Bartender: 'Bartender',
  Manager: 'Manager',
  Cook: 'Cook',
  Kitchen_Hand: 'Kitchen Hand',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FullTime: 'Full Time',
  PartTime: 'Part Time',
  Casual: 'Casual',
};
