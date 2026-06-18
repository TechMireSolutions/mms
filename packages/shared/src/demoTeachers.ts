import type { Teacher } from './teacherTypes.js';

/** Demo faculty records — contact ids align with default `contacts` seeds (1–5). */
export const DEMO_TEACHERS: Teacher[] = [
  {
    id: 'tch1',
    contactId: 1,
    employeeId: 'TCH-0001',
    specialization: 'Hifz',
    status: 'active',
    joinDate: '2020-03-15',
    qualification: 'Ijazah in Hifz',
  },
  {
    id: 'tch2',
    contactId: 3,
    employeeId: 'TCH-0002',
    specialization: 'Qaidah',
    status: 'active',
    joinDate: '2021-08-01',
    qualification: 'BA Islamic Studies',
  },
  {
    id: 'tch3',
    contactId: 2,
    employeeId: 'TCH-0003',
    specialization: 'Tajweed',
    status: 'active',
    joinDate: '2019-01-10',
    qualification: 'Qiraat certification',
  },
  {
    id: 'tch4',
    contactId: 4,
    employeeId: 'TCH-0004',
    specialization: 'Islamic Studies',
    status: 'on_leave',
    joinDate: '2022-04-20',
    qualification: 'MA Islamic Studies',
  },
  {
    id: 'tch5',
    contactId: 5,
    employeeId: 'TCH-0005',
    specialization: 'Hifz',
    status: 'active',
    joinDate: '2018-06-01',
    qualification: 'Ijazah in Hifz',
  },
];
