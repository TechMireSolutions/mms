import { DEFAULT_BRANDING_SETTINGS, resolveBrandingChartPaletteHex } from "@mms/shared";

export const ROLES = ["admin", "teacher", "accountant"] as const;
export type UserRole = typeof ROLES[number];

export interface StatCardItem {
  id: string;
  title: string;
  value: string;
  sub: string;
  trend: number;
  icon: string;
  color: "emerald" | "blue" | "violet" | "amber" | "red";
}

export const adminStats: StatCardItem[] = [];
export const teacherStats: StatCardItem[] = [];
export const accountantStats: StatCardItem[] = [];

export interface EnrollmentPoint {
  month: string;
  students: number;
}

export const enrollmentData: EnrollmentPoint[] = [];

export interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export const revenueData: RevenuePoint[] = [];

export interface AttendancePoint {
  day: string;
  rate: number;
}

export const attendanceData: AttendancePoint[] = [];

export interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}

export const hasanatData: HasanatPoint[] = [];

export interface UpcomingSessionItem {
  id: number;
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
  status: "live" | "upcoming";
}

export const upcomingSessions: UpcomingSessionItem[] = [];

export interface DashboardNotification {
  id: number;
  type: "fee" | "event" | "student" | "attendance";
  title: string;
  desc: string;
  time: string;
  urgent: boolean;
}

export const notifications: Record<UserRole, DashboardNotification[]> = {
  admin: [],
  teacher: [],
  accountant: [],
};

export interface OutstandingFeeItem {
  id: number;
  student: string;
  class: string;
  amount: number;
  months: number;
  contact: string;
}

export const outstandingFees: OutstandingFeeItem[] = [];
