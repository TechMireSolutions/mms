const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'mms.db');
console.log(`Connecting to SQLite database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database does not exist at ${dbPath}.`);
  process.exit(1);
}

const db = new Database(dbPath);

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta'];
const MALE_NAMES = ['Farhan', 'Saad', 'Bilal', 'Zaid', 'Yusuf', 'Hamza', 'Shakir', 'Mustafa', 'Zain', 'Tariq'];
const FEMALE_NAMES = ['Ayesha', 'Fatima', 'Zainab', 'Maryam', 'Khadija', 'Hira', 'Sana', 'Rabia', 'Bushra', 'Farah'];
const SURNAMES = ['Khan', 'Qureshi', 'Siddiqui', 'Malik', 'Abbasi', 'Butt', 'Sheikh', 'Naqvi', 'Hussain', 'Rizvi'];
const SPECIALIZATIONS = ['Qaidah', 'Tajweed', 'Hifz', 'Tafseer', 'Arabic Grammar', 'Hadith'];
const QUALIFICATIONS = ['Ijazah in Hifz', 'BA Islamic Studies', 'MA Islamic Studies', 'Qiraat Certification'];

function pad(n, digits) {
  return String(n).padStart(digits, '0');
}

function pick(items, idx) {
  return items[idx % items.length];
}

try {
  db.pragma('foreign_keys = OFF');

  // Helper to load collection array
  function getCollection(name) {
    const r = db.prepare("SELECT data FROM collections WHERE name = ?").get(name);
    return r ? JSON.parse(r.data) : [];
  }

  // Helper to save collection array
  function saveCollection(name, data) {
    const serialized = JSON.stringify(data);
    db.prepare(`
      INSERT INTO collections (name, data, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET data = ?, updated_at = ?
    `).run(name, serialized, Math.floor(Date.now() / 1000), serialized, Math.floor(Date.now() / 1000));
  }

  db.transaction(() => {
    // 1. Fetch current data
    const contacts = getCollection('t:dar-ul-quran:contacts');
    const students = getCollection('t:dar-ul-quran:students');
    const teachers = getCollection('t:dar-ul-quran:teachers');
    const enrollments = getCollection('t:dar-ul-quran:enrollments');
    const sessions = getCollection('t:dar-ul-quran:sessions');
    const payments = getCollection('t:dar-ul-quran:finance_payments');

    console.log(`Current stats:`);
    console.log(`- Contacts: ${contacts.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Teachers: ${teachers.length}`);
    console.log(`- Enrollments: ${enrollments.length}`);
    console.log(`- Sessions: ${sessions.length}`);
    console.log(`- Payments: ${payments.length}`);

    let nextContactId = Math.max(...contacts.map(c => typeof c.id === 'number' ? c.id : parseInt(c.id) || 0), 10000) + 1;

    // --- EXPAND STUDENTS & STUDENT CONTACTS & PARENTS ---
    const targetStudents = 105;
    if (students.length < targetStudents) {
      const needed = targetStudents - students.length;
      console.log(`Expanding students: adding ${needed} records...`);
      for (let i = 0; i < needed; i++) {
        const idx = students.length + i + 1;
        const female = idx % 2 === 0;
        const studentFirst = pick(female ? FEMALE_NAMES : MALE_NAMES, idx);
        const parentFirst = pick(MALE_NAMES, idx + 5);
        const lastName = pick(SURNAMES, idx);

        const studentId = `st${idx}`;
        const studentContactId = nextContactId++;
        const parentContactId = nextContactId++;

        // Add parent contact
        contacts.push({
          id: parentContactId,
          name: `${parentFirst} ${lastName}`,
          firstName: parentFirst,
          lastName: lastName,
          gender: 'male',
          lifecycleStage: 'Parent',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          phones: [{ label: 'Mobile', number: `+92 300 ${pad(1000000 + idx * 773, 7)}` }],
          emails: [{ label: 'Personal', address: `${studentFirst.toLowerCase()}.${lastName.toLowerCase()}.parent@gmail.com` }],
          relationships: [],
          activities: [],
        });

        // Add student contact
        contacts.push({
          id: studentContactId,
          name: `${studentFirst} ${lastName}`,
          firstName: studentFirst,
          lastName: lastName,
          gender: female ? 'female' : 'male',
          dob: `2014-06-${pad((idx % 28) + 1, 2)}`,
          email: `${studentFirst.toLowerCase()}.${lastName.toLowerCase()}@student.com`,
          phone: `+92 333 ${pad(2000000 + idx * 911, 7)}`,
          city: pick(CITIES, idx),
          country: 'Pakistan',
          lifecycleStage: 'Student',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          phones: [{ label: 'Mobile', number: `+92 333 ${pad(2000000 + idx * 911, 7)}` }],
          emails: [{ label: 'Personal', address: `${studentFirst.toLowerCase()}.${lastName.toLowerCase()}@student.com` }],
          relationships: [{ contactId: parentContactId, type: 'Father' }],
          activities: [],
        });

        // Add student record
        students.push({
          id: studentId,
          contactId: studentContactId,
          motherContactId: parentContactId, // mapped to father/mother contact id
          grNumber: `${pad(idx, 4)}-2026`,
          status: 'active',
          registeredDate: `2025-01-${pad((idx % 28) + 1, 2)}`,
          enrolledSessions: ['s1'],
        });
      }
    }

    // --- EXPAND TEACHERS & TEACHER CONTACTS ---
    const targetTeachers = 105;
    if (teachers.length < targetTeachers) {
      const needed = targetTeachers - teachers.length;
      console.log(`Expanding teachers: adding ${needed} records...`);
      for (let i = 0; i < needed; i++) {
        const idx = teachers.length + i + 1;
        const female = idx % 3 === 0;
        const first = pick(female ? FEMALE_NAMES : MALE_NAMES, idx);
        const lastName = pick(SURNAMES, idx + 1);
        const name = `${female ? 'Ustadha' : 'Ustadh'} ${first} ${lastName}`;
        const contactId = nextContactId++;
        const teacherId = `tch${idx}`;

        // Add teacher contact
        contacts.push({
          id: contactId,
          name,
          firstName: female ? 'Ustadha' : 'Ustadh',
          lastName: `${first} ${lastName}`,
          gender: female ? 'female' : 'male',
          dob: `198${idx % 10}-03-${pad((idx % 28) + 1, 2)}`,
          email: `${first.toLowerCase()}.${lastName.toLowerCase()}@madrasa.app`,
          phone: `+92 300 ${pad(3000000 + idx * 431, 7)}`,
          city: pick(CITIES, idx),
          state: 'Sindh',
          country: 'Pakistan',
          lifecycleStage: 'Employee',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          phones: [{ label: 'Mobile', number: `+92 300 ${pad(3000000 + idx * 431, 7)}` }],
          emails: [{ label: 'Work', address: `${first.toLowerCase()}.${lastName.toLowerCase()}@madrasa.app` }],
          relationships: [],
          activities: [],
        });

        // Add teacher record
        teachers.push({
          id: teacherId,
          contactId: contactId,
          employeeId: `TCH-${pad(idx, 4)}`,
          specialization: pick(SPECIALIZATIONS, idx),
          status: 'active',
          joinDate: `2018-09-${pad((idx % 28) + 1, 2)}`,
          qualification: pick(QUALIFICATIONS, idx),
        });
      }
    }

    // --- EXPAND SESSIONS ---
    const targetSessions = 105;
    if (sessions.length < targetSessions) {
      const needed = targetSessions - sessions.length;
      console.log(`Expanding sessions: adding ${needed} records...`);
      for (let i = 0; i < needed; i++) {
        const idx = sessions.length + i + 1;
        const type = pick(['Hifz', 'Tajweed', 'Qaidah', 'Nazrah'], idx);
        const name = `${type} Course Batch ${pad(idx, 3)}`;

        sessions.push({
          id: `s${idx}`,
          name,
          type,
          status: idx % 10 === 0 ? 'completed' : 'active',
          startDate: `2025-${pad(((idx % 4) * 3) + 1, 2)}-01`,
          endDate: `2025-${pad(((idx % 4) * 3) + 3, 2)}-28`,
          baseFee: idx % 2 === 0 ? 3000 : 2500,
          currency: 'PKR',
          description: `Automatically generated demo course session for ${name}.`,
          classes: [
            { id: `c${idx}_1`, name: `${type} Group A`, room: `Classroom ${idx % 10}` },
            { id: `c${idx}_2`, name: `${type} Group B`, room: `Classroom ${(idx + 1) % 10}` }
          ],
          timetable: [],
          discounts: [],
          budget: {
            totalRevenue: 50000,
            collected: 40000,
            expenses: [],
            incomes: []
          },
          events: [],
          tabarruk: []
        });
      }
    }

    // --- EXPAND ENROLLMENTS ---
    const targetEnrollments = 105;
    if (enrollments.length < targetEnrollments) {
      const needed = targetEnrollments - enrollments.length;
      console.log(`Expanding enrollments: adding ${needed} records...`);
      for (let i = 0; i < needed; i++) {
        const idx = enrollments.length + i + 1;
        const student = pick(students, idx);
        const session = pick(sessions, idx);
        const isPaid = idx % 2 === 0;

        enrollments.push({
          id: `enr${pad(idx, 3)}`,
          studentId: student.id,
          sessionId: session.id,
          sessionName: session.name,
          classId: session.classes[0].id,
          className: session.classes[0].name,
          enrolledDate: session.startDate,
          baseFee: session.baseFee,
          discountType: 'none',
          discountLabel: 'No Discount',
          discountPct: 0,
          discountAmt: 0,
          finalFee: session.baseFee,
          status: 'confirmed',
          invoiceId: `inv${pad(idx, 3)}`,
          paymentStatus: isPaid ? 'paid' : 'pending',
          notes: 'Auto-generated migration demo enrollment.',
          timeline: [
            { event: 'Created', timestamp: new Date(session.startDate).toISOString() }
          ]
        });
      }
    }

    // --- EXPAND PAYMENTS ---
    const targetPayments = 105;
    if (payments.length < targetPayments) {
      const needed = targetPayments - payments.length;
      console.log(`Expanding finance payments: adding ${needed} records...`);
      for (let i = 0; i < needed; i++) {
        const idx = payments.length + i + 1;
        // Match with some student / enrollment
        const studentIdx = idx % students.length;
        const student = students[studentIdx];
        const studentContact = contacts.find(c => c.id === student.contactId);
        const name = studentContact ? studentContact.name : `Student ${studentIdx}`;

        payments.push({
          id: `pay${pad(idx, 3)}`,
          invoiceId: `inv${pad(idx, 3)}`,
          studentName: name,
          amount: idx % 2 === 0 ? 3000 : 2500,
          date: `2025-06-${pad((idx % 28) + 1, 2)}`,
          method: pick(['Cash', 'Bank Transfer', 'Online'], idx),
          receivedBy: 'Admin',
          note: 'Demo monthly tuition fee payment'
        });
      }
    }

    // 4. Save expanded collections
    saveCollection('t:dar-ul-quran:contacts', contacts);
    saveCollection('t:dar-ul-quran:students', students);
    saveCollection('t:dar-ul-quran:teachers', teachers);
    saveCollection('t:dar-ul-quran:enrollments', enrollments);
    saveCollection('t:dar-ul-quran:sessions', sessions);
    saveCollection('t:dar-ul-quran:finance_payments', payments);

    console.log(`\nExpansion completed successfully!`);
    console.log(`New counts:`);
    console.log(`- Contacts: ${contacts.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Teachers: ${teachers.length}`);
    console.log(`- Enrollments: ${enrollments.length}`);
    console.log(`- Sessions: ${sessions.length}`);
    console.log(`- Payments: ${payments.length}`);
  })();

  db.pragma('foreign_keys = ON');
  console.log('Database transaction successfully committed.');
} catch (error) {
  console.error('Data expansion failed:', error);
} finally {
  db.close();
}
