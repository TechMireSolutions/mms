export interface StudentSession {
  id: string;
  name: string;
  type: string;
  teacher: string;
  room: string;
  time: string;
  days: string[];
  capacity: number;
  enrolled: number;
  ageMin: number;
  ageMax: number;
  gender: string;
  baseFee: number;
  currency: string;
}

export const SESSIONS: StudentSession[] = [];

export interface Student {
  id: string;
  contactId: number;
  name: string;
  cnic: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  fatherName: string;
  motherName: string;
  fatherContactId: number | null;
  motherContactId: number | null;
  guardianName?: string;
  guardianContactId?: number | null;
  enrolledSessions: string[];
  status: string;
  registeredDate: string;
  discountType: "none" | "sibling" | "financial_aid" | "staff" | "scholarship";
  discountPct: number;
  city: string;
  grNumber?: string;
  registrationType?: "regular" | "private" | "transfer" | "other";
}

export const STUDENTS: Student[] = [];

export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export interface EligibilityResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export function runEligibilityChecks(student: Partial<Student>, session: StudentSession): EligibilityResult[] {
  const checks: EligibilityResult[] = [];
  
  if (!student.dob) {
    checks.push({ id: "age", label: "Age Check", status: "warn", detail: "Date of birth not set — cannot verify age." });
  } else {
    const age = calcAge(student.dob) ?? 0;
    const minAge = session.ageMin;
    const maxAge = session.ageMax;
    if (age < minAge || age > maxAge) {
      checks.push({ id: "age", label: "Age Check", status: "fail", detail: `Student is ${age} yrs old. Session requires age ${minAge}–${maxAge}.` });
    } else {
      checks.push({ id: "age", label: "Age Check", status: "pass", detail: `Age ${age} is within allowed range (${minAge}–${maxAge}).` });
    }
  }

  if (session.gender !== "any" && student.gender !== session.gender) {
    checks.push({ id: "gender", label: "Gender Check", status: "fail", detail: `Session is ${session.gender}-only. Student is ${student.gender}.` });
  } else {
    checks.push({ id: "gender", label: "Gender Check", status: "pass", detail: "Gender matches session requirement." });
  }

  const spotsLeft = session.capacity - session.enrolled;
  if (spotsLeft <= 0) {
    checks.push({ id: "capacity", label: "Session Capacity", status: "fail", detail: `Session is full (${session.enrolled}/${session.capacity} students).` });
  } else if (spotsLeft <= 3) {
    checks.push({ id: "capacity", label: "Session Capacity", status: "warn", detail: `Only ${spotsLeft} spots remaining.` });
  } else {
    checks.push({ id: "capacity", label: "Session Capacity", status: "pass", detail: `${spotsLeft} of ${session.capacity} spots available.` });
  }

  const isEnrolled = student.enrolledSessions && student.enrolledSessions.includes(session.id);
  if (isEnrolled) {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "fail", detail: "Student is already enrolled in this session." });
  } else {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "pass", detail: "Student is not already enrolled in this session." });
  }

  return checks;
}
