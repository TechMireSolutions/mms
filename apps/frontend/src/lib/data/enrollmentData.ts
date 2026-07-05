import { Student } from "@/lib/data/studentsData";
import { Session, Class, Discount } from "@/lib/data/sessionsData";

import type { Enrollment, EnrollmentTimelineItem } from '@mms/shared';
export type { Enrollment, EnrollmentTimelineItem };

export const ENROLLMENT_STATUSES = [
  { id: "pending",   label: "Pending",   color: "bg-warning/10 text-warning border-warning/30" },
  { id: "confirmed", label: "Confirmed", color: "bg-success/10 text-success border-success/30" },
  { id: "cancelled", label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { id: "completed", label: "Completed", color: "bg-info/10 text-info border-info/30" },
];

export const SAMPLE_ENROLLMENTS: Enrollment[] = [];

export interface CalculatedFee {
  id: string;
  label: string;
  pct: number;
  discountAmt: number;
  finalFee: number;
  reason?: string;
}

export interface CheckResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export interface EnrollmentStatus {
  id: "pending" | "confirmed" | "cancelled" | "completed";
  label: string;
  color: string;
}

export const STATUS_MAP: Record<string, EnrollmentStatus> = {
  pending: ENROLLMENT_STATUSES[0] as EnrollmentStatus,
  confirmed: ENROLLMENT_STATUSES[1] as EnrollmentStatus,
  cancelled: ENROLLMENT_STATUSES[2] as EnrollmentStatus,
  completed: ENROLLMENT_STATUSES[3] as EnrollmentStatus
};

export function suggestClass(student: Partial<Student>, session: Session): Class | null {
  if (!student.dob) return null;
  const birthYear = parseInt(student.dob.split("-")[0]);
  const age = 2026 - birthYear;
  for (const sessionClass of session.classes) {
    if (age >= sessionClass.ageMin && age <= sessionClass.ageMax) {
      if (sessionClass.gender === "any" || student.gender === sessionClass.gender) {
        return sessionClass;
      }
    }
  }
  return session.classes[0] || null;
}

export function runFullEligibility(
  student: Partial<Student>,
  session: Session,
  targetClass: Class | null,
  students: Student[]
): CheckResult[] {
  const checks: CheckResult[] = [];
  
  if (!student.dob) {
    checks.push({ id: "age", label: "Age Eligibility", status: "warn", detail: "Date of birth not set — cannot verify age." });
  } else {
    const age = 2026 - parseInt(student.dob.split("-")[0]);
    const minAge = targetClass ? targetClass.ageMin : 5;
    const maxAge = targetClass ? targetClass.ageMax : 25;
    if (age < minAge || age > maxAge) {
      checks.push({ id: "age", label: "Age Eligibility", status: "fail", detail: `Student is ${age} yrs old. Class requires age ${minAge}–${maxAge}.` });
    } else {
      checks.push({ id: "age", label: "Age Eligibility", status: "pass", detail: `Age ${age} is within allowed range (${minAge}–${maxAge}).` });
    }
  }

  if (targetClass && targetClass.gender !== "any" && student.gender !== targetClass.gender) {
    checks.push({ id: "gender", label: "Gender Match", status: "fail", detail: `Class is ${targetClass.gender}-only. Student is ${student.gender}.` });
  } else {
    checks.push({ id: "gender", label: "Gender Match", status: "pass", detail: `Gender matches class requirement.` });
  }

  if (targetClass) {
    const spotsLeft = targetClass.capacity - targetClass.enrolled;
    if (spotsLeft <= 0) {
      checks.push({ id: "capacity", label: "Class Capacity", status: "fail", detail: `Class is full (${targetClass.enrolled}/${targetClass.capacity} students).` });
    } else if (spotsLeft <= 3) {
      checks.push({ id: "capacity", label: "Class Capacity", status: "warn", detail: `Only ${spotsLeft} spots remaining.` });
    } else {
      checks.push({ id: "capacity", label: "Class Capacity", status: "pass", detail: `${spotsLeft} of ${targetClass.capacity} spots available.` });
    }
  } else {
    checks.push({ id: "capacity", label: "Class Capacity", status: "fail", detail: "No class assigned/available." });
  }

  const isEnrolled = student.enrolledSessions && student.enrolledSessions.includes(session.id);
  if (isEnrolled) {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "fail", detail: "Student is already enrolled in this session." });
  } else {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "pass", detail: "Student is not already enrolled in this session." });
  }

  const hasSibling = students.some((candidate) => candidate.id !== student.id && (candidate.fatherName === student.fatherName || candidate.motherName === student.motherName) && candidate.status === "active");
  if (hasSibling) {
    checks.push({ id: "sibling", label: "Sibling Connection", status: "pass", detail: "Active sibling detected. Sibling discount eligible." });
  } else {
    checks.push({ id: "sibling", label: "Sibling Connection", status: "warn", detail: "No active sibling detected in the system." });
  }

  return checks;
}

export function calcFee(
  baseFee: number,
  student: Partial<Student>,
  _students: Student[],
  _sessionDiscounts: Discount[]
): CalculatedFee {
  const discountType = student.discountType || "none";
  let pct = student.discountPct || 0;
  let label = "No Discount";

  if (discountType === "sibling") {
    label = "Sibling Discount";
    pct = 10;
  } else if (discountType === "financial_aid") {
    label = "Financial Aid";
    pct = 25;
  } else if (discountType === "staff") {
    label = "Staff Child";
    pct = 50;
  } else if (discountType === "scholarship") {
    label = "Full Scholarship";
    pct = 100;
  }

  const discountAmt = Math.round((baseFee * pct) / 100);
  const finalFee = baseFee - discountAmt;

  return {
    id: discountType,
    label,
    pct,
    discountAmt,
    finalFee,
    reason: pct > 0 ? `${label} of ${pct}% applied.` : undefined
  };
}
