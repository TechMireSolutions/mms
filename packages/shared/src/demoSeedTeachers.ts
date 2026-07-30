import type { Contact } from './contactTypes.js';
import type { Teacher } from './teacherTypes.js';
import { TEACHER_SPECIALIZATION_VALUES } from './teacherTypes.js';
import {
  DEMO_CITIES,
  DEMO_FEMALE_FIRST,
  DEMO_LAST_NAMES,
  DEMO_MALE_FIRST,
  DEMO_QUALIFICATIONS,
  DEMO_TEACHER_COUNT,
  DEMO_TEACHER_DATE,
  DEMO_TEACHER_FEMALE_TITLES,
  DEMO_TEACHER_MALE_TITLES,
  demoJoinDate,
  demoPad,
  demoPhoneSuffix,
  demoPick,
  demoSlug,
  demoTeacherDob,
} from './demoSeedConstants.js';

/** Builds faculty contact profiles (ids 1…{@link DEMO_TEACHER_COUNT}). */
export function buildDemoTeacherContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (let index = 1; index <= DEMO_TEACHER_COUNT; index += 1) {
    const female = index % 5 === 0 || index % 7 === 0;
    const firstPool = female ? DEMO_FEMALE_FIRST : DEMO_MALE_FIRST;
    const title = female ? demoPick(DEMO_TEACHER_FEMALE_TITLES, index) : demoPick(DEMO_TEACHER_MALE_TITLES, index);
    const firstName = demoPick(firstPool, index);
    const lastName = demoPick(DEMO_LAST_NAMES, index + 3);
    const name = `${title} ${firstName} ${lastName}`;
    const email = `${demoSlug(`${firstName}.${lastName}`)}@madrasa.app`;
    const phone = `+92 300 ${demoPhoneSuffix(index)}`;
    const city = demoPick(DEMO_CITIES, index);

    contacts.push({
      id: index,
      name,
      firstName: title,
      lastName: `${firstName} ${lastName}`,
      gender: female ? 'female' : 'male',
      dob: demoTeacherDob(index),
      email,
      phone,
      city,
      state: 'Sindh',
      country: 'Pakistan',
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
  for (let index = 1; index <= DEMO_TEACHER_COUNT; index += 1) {
    const status: Teacher['status'] =
      index % 11 === 0 ? 'inactive' : index % 9 === 0 ? 'on_leave' : 'active';
    teachers.push({
      id: `tch${index}`,
      contactId: index,
      employeeId: `TCH-${demoPad(index, 4)}`,
      specialization: demoPick([...TEACHER_SPECIALIZATION_VALUES], index),
      status,
      joinDate: demoJoinDate(index),
      qualification: demoPick(DEMO_QUALIFICATIONS, index),
    });
  }
  return teachers;
}
