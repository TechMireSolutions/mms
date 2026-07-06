import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { initDb } from './db/database.js';
import { getDb } from './db/dbClient.js';
import { sessions, enrollments, students, contacts } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const subdomain = process.argv[2];
  if (!subdomain) {
    console.error('Missing subdomain argument');
    process.exit(1);
  }

  console.log(`Seeding session, class, and enrollment for subdomain: "${subdomain}"...`);
  await initDb();
  const db = getDb();

  // 1. Find contact Jane Doe
  const contactRows = await db.select().from(contacts).where(eq(contacts.workspaceSubdomain, subdomain));
  console.log(`Found ${contactRows.length} contact rows in database.`);
  const janeContact = contactRows.find(r => {
    const data = r.customData as any;
    return data.firstName?.toLowerCase().includes('jane') || data.name?.toLowerCase().includes('jane');
  });

  if (!janeContact) {
    console.error('Contact Jane Doe not found in database');
    process.exit(1);
  }
  console.log(`Found contact Jane Doe: ID=${janeContact.id}`);

  // 2. Find student record linked to contact Jane Doe
  const studentRows = await db.select().from(students).where(eq(students.workspaceSubdomain, subdomain));
  console.log(`Found ${studentRows.length} student rows in database.`);
  const janeStudent = studentRows.find(r => {
    const data = r.customData as any;
    return String(data.contactId) === String(janeContact.id);
  });

  if (!janeStudent) {
    console.error(`Student record linked to contact ID ${janeContact.id} not found`);
    process.exit(1);
  }
  console.log(`Found student record: ID=${janeStudent.id}`);

  // 3. Insert session with class
  const sessionData = {
    id: 's1',
    name: 'Quran Hifz Session 2026',
    type: 'Hifz',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    baseFee: 1000,
    currency: 'PKR',
    classes: [
      {
        id: 'c1',
        name: 'Morning Quran Class',
        ageMin: 5,
        ageMax: 18,
        gender: 'any',
        teacherId: '',
        teacherName: 'Unassigned',
        capacity: 20,
        enrolled: 1
      }
    ]
  };

  await db.insert(sessions).values({
    id: 's1',
    workspaceSubdomain: subdomain,
    customData: sessionData,
  }).onConflictDoUpdate({
    target: sessions.id,
    set: { customData: sessionData },
  });

  // 4. Insert enrollment for Jane Doe in class c1
  const enrollmentData = {
    id: 'e1',
    studentId: janeStudent.id,
    studentName: 'Jane Doe',
    classId: 'c1',
    className: 'Morning Quran Class',
    sessionId: 's1',
    sessionName: 'Quran Hifz Session 2026',
    status: 'active',
    enrolledDate: new Date().toISOString().split('T')[0],
  };

  await db.insert(enrollments).values({
    id: 'e1',
    workspaceSubdomain: subdomain,
    customData: enrollmentData,
  }).onConflictDoUpdate({
    target: enrollments.id,
    set: { customData: enrollmentData },
  });

  console.log('Seeding completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
