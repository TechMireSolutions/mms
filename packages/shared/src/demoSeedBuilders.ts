import type { Contact } from './contactTypes.js';
import type { Student } from './studentTypes.js';
import type { Teacher } from './teacherTypes.js';
import { TEACHER_SPECIALIZATION_VALUES } from './teacherTypes.js';

export const DEMO_TEACHER_COUNT = 30;
export const DEMO_STUDENT_COUNT = 100;
export const DEMO_STUDENT_CONTACT_ID_START = 1001;
export const DEMO_PARENT_CONTACT_ID_START = 2001;

const DEMO_TEACHER_DATE = '2024-01-01';
const DEMO_STUDENT_DATE = '2025-01-01';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta'] as const;

const MALE_FIRST = [
  'Abdullah', 'Usman', 'Ahmed', 'Hassan', 'Omar', 'Yusuf', 'Ibrahim', 'Hamza', 'Bilal', 'Zaid',
  'Khalid', 'Rashid', 'Tariq', 'Imran', 'Farhan', 'Saad', 'Ali', 'Hussain', 'Shakir', 'Faisal',
] as const;

const FEMALE_FIRST = [
  'Fatima', 'Ayesha', 'Mariam', 'Sawdah', 'Salma', 'Hira', 'Zainab', 'Khadija', 'Amina', 'Sana',
  'Rabia', 'Nadia', 'Saima', 'Hina', 'Laiba', 'Mahnoor', 'Alisha', 'Bushra', 'Samina', 'Farah',
] as const;

const LAST_NAMES = [
  'Rizvi', 'Hussain', 'Khan', 'Lodhi', 'Siddiqui', 'Malik', 'Qureshi', 'Sheikh', 'Ansari', 'Hashmi',
  'Chaudhry', 'Butt', 'Mirza', 'Gilani', 'Jafri', 'Naqvi', 'Zaidi', 'Abbasi', 'Memon', 'Baloch',
] as const;

const TEACHER_MALE_TITLES = ['Sheikh', 'Qari', 'Ustadh'] as const;
const TEACHER_FEMALE_TITLES = ['Ustadha'] as const;

const QUALIFICATIONS = [
  'Ijazah in Hifz',
  'BA Islamic Studies',
  'MA Islamic Studies',
  'Qiraat certification',
  'Dars-e-Nizami',
  'Tajweed certification',
] as const;

function pad(n: number, digits: number): string {
  return String(n).padStart(digits, '0');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length]!;
}

function studentDob(index: number): string {
  const year = 2008 + (index % 13);
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function teacherDob(index: number): string {
  const year = 1975 + (index % 20);
  const month = ((index * 3) % 12) + 1;
  const day = ((index * 5) % 27) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function joinDate(index: number): string {
  const year = 2015 + (index % 10);
  const month = ((index * 2) % 12) + 1;
  const day = ((index * 4) % 27) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function registeredDate(index: number): string {
  const year = 2024 + (index % 2);
  const month = ((index * 2) % 12) + 1;
  const day = ((index * 3) % 27) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function phoneSuffix(seed: number): string {
  return pad(1000000 + seed * 7919, 7);
}

/** Builds faculty contact profiles (ids 1…{@link DEMO_TEACHER_COUNT}). */
export function buildDemoTeacherContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (let i = 1; i <= DEMO_TEACHER_COUNT; i += 1) {
    const female = i % 5 === 0 || i % 7 === 0;
    const firstPool = female ? FEMALE_FIRST : MALE_FIRST;
    const title = female ? pick(TEACHER_FEMALE_TITLES, i) : pick(TEACHER_MALE_TITLES, i);
    const firstName = pick(firstPool, i);
    const lastName = pick(LAST_NAMES, i + 3);
    const name = `${title} ${firstName} ${lastName}`;
    const email = `${slug(`${firstName}.${lastName}`)}@madrasa.app`;
    const phone = `+92 300 ${phoneSuffix(i)}`;
    const city = pick(CITIES, i);

    contacts.push({
      id: i,
      name,
      firstName: title,
      lastName: `${firstName} ${lastName}`,
      gender: female ? 'female' : 'male',
      dob: teacherDob(i),
      email,
      phone,
      city,
      state: 'Sindh',
      country: 'Pakistan',
      lifecycleStage: 'Employee',
      createdAt: DEMO_TEACHER_DATE,
      updatedAt: DEMO_TEACHER_DATE,
      phones: [{ label: 'Mobile', number: phone }],
      emails: [{ label: 'Work', address: email }],
      relationships: [],
      activities: [],
    });
  }
  return contacts;
}

/** Builds demo teacher rows linked to {@link buildDemoTeacherContacts}. */
export function buildDemoTeachers(): Teacher[] {
  const teachers: Teacher[] = [];
  for (let i = 1; i <= DEMO_TEACHER_COUNT; i += 1) {
    const status: Teacher['status'] =
      i % 11 === 0 ? 'inactive' : i % 9 === 0 ? 'on_leave' : 'active';
    teachers.push({
      id: `tch${i}`,
      contactId: i,
      employeeId: `TCH-${pad(i, 4)}`,
      specialization: pick([...TEACHER_SPECIALIZATION_VALUES], i),
      status,
      joinDate: joinDate(i),
      qualification: pick(QUALIFICATIONS, i),
    });
  }
  return teachers;
}

/** Builds parent contacts for demo students (ids 2001…). */
export function buildDemoStudentParentContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (let i = 1; i <= DEMO_STUDENT_COUNT; i += 1) {
    const firstName = pick(FEMALE_FIRST, i + 11);
    const lastName = pick(LAST_NAMES, i + 7);
    const name = `${firstName} ${lastName}`;
    const email = `${slug(`${firstName}.${lastName}`)}@parent.com`;
    const phone = `+92 300 ${phoneSuffix(2000 + i)}`;

    contacts.push({
      id: DEMO_PARENT_CONTACT_ID_START + i - 1,
      name,
      firstName,
      lastName,
      gender: 'female',
      lifecycleStage: 'Parent',
      createdAt: DEMO_STUDENT_DATE,
      updatedAt: DEMO_STUDENT_DATE,
      phones: [{ label: 'Mobile', number: phone }],
      emails: [{ label: 'Personal', address: email }],
      relationships: [],
      activities: [],
    });
  }
  return contacts;
}

/** Builds student contact profiles (ids 1001…). */
export function buildDemoStudentContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (let i = 1; i <= DEMO_STUDENT_COUNT; i += 1) {
    const female = i % 4 === 0;
    const firstName = female ? pick(FEMALE_FIRST, i) : pick(MALE_FIRST, i);
    const lastName = pick(LAST_NAMES, i);
    const name = `${firstName} ${lastName}`;
    const email = `${slug(`${firstName}.${lastName}`)}@student.com`;
    const phone = `+92 333 ${phoneSuffix(1000 + i)}`;
    const parentId = DEMO_PARENT_CONTACT_ID_START + i - 1;

    contacts.push({
      id: DEMO_STUDENT_CONTACT_ID_START + i - 1,
      name,
      firstName,
      lastName,
      gender: female ? 'female' : 'male',
      dob: studentDob(i),
      email,
      phone,
      city: pick(CITIES, i + 2),
      country: 'Pakistan',
      lifecycleStage: 'Student',
      createdAt: DEMO_STUDENT_DATE,
      updatedAt: DEMO_STUDENT_DATE,
      phones: [{ label: 'Mobile', number: phone }],
      emails: [{ label: 'Personal', address: email }],
      relationships: [{ contactId: parentId, type: 'Mother' }],
      activities: [],
    });
  }
  return contacts;
}

/** Builds demo student rows linked to {@link buildDemoStudentContacts}. */
export function buildDemoStudents(): Student[] {
  const students: Student[] = [];
  for (let i = 1; i <= DEMO_STUDENT_COUNT; i += 1) {
    const status: Student['status'] =
      i % 13 === 0 ? 'suspended' : i % 9 === 0 ? 'inactive' : 'active';
    students.push({
      id: `st${i}`,
      contactId: DEMO_STUDENT_CONTACT_ID_START + i - 1,
      motherContactId: DEMO_PARENT_CONTACT_ID_START + i - 1,
      grNumber: `${pad(i, 4)}-2026`,
      status,
      registeredDate: registeredDate(i),
      enrolledSessions: i % 3 === 0 ? ['s1'] : [],
    });
  }
  return students;
}
