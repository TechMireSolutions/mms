import { type Student, calcAge } from "@mms/shared";

export type { Student };
export { calcAge };

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

/** Legacy seed placeholders — entity rows come from REST/Query. */
export const SESSIONS: StudentSession[] = [];
export const STUDENTS: Student[] = [];
