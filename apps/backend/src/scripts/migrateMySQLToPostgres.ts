import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import { loadBackendEnv } from '../config/loadEnv.js';
import { getRootDb, initializeDatabaseConnection, closeDatabase } from '../db/dbConnection.js';
import * as schema from '../db/schema/index.js';

loadBackendEnv();
initializeDatabaseConnection();

const pgDb = getRootDb();

function formatDateString(dateVal: any): string {
  if (!dateVal) return '2026-08-29';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '2026-08-29';
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return '2026-08-29';
  }
}

async function runMigration() {
  console.log('🚀 Starting Data Migration: MySQL ("mms") ➔ PostgreSQL ("mms")');
  console.log('Madrasa Tenant: Dar ul Quran (subdomain: darulquran)');

  // Connect to legacy MySQL
  const mysqlConn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'mms',
    port: 3306,
  });

  console.log('✓ Connected to legacy MySQL database.');

  // Create Workspace
  const workspaceId = 'darulquran';
  const subdomain = 'darulquran';
  await pgDb.insert(schema.workspaces).values({
    id: workspaceId,
    subdomain: subdomain,
    madrasaName: 'Dar ul Quran',
    enabled: true,
  }).onConflictDoNothing();

  console.log('✓ Created Dar ul Quran workspace tenant.');

  // Map stores for legacy primary key to new UUID mappings
  const contactMap = new Map<number, string>();
  const userMap = new Map<number, string>();
  const teacherMap = new Map<number, string>();
  const studentMap = new Map<number, string>();
  const sessionMap = new Map<number, string>();
  const classMap = new Map<number, string>();
  const inventoryItemMap = new Map<number, string>();
  const workshopEventMap = new Map<number, string>();
  const workshopParticipantMap = new Map<number, string>();
  const fundraisingCampaignMap = new Map<number, string>();
  const accountingAccountMap = new Map<number, string>();
  const accountingEntryMap = new Map<number, string>();

  await pgDb.transaction(async (tx) => {
    // 1. Contacts
    console.log('[ETL] Migrating contacts...');
    const [mysqlContacts] = await mysqlConn.query<any[]>('SELECT * FROM contacts');
    for (const c of mysqlContacts) {
      const pgId = crypto.randomUUID();
      const fullName = c.full_name || 'Unknown';
      const nameParts = fullName.split(' ');
      const first = nameParts[0] || 'Unknown';
      const last = nameParts.slice(1).join(' ') || '';
      
      await tx.insert(schema.contacts).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        firstName: first,
        lastName: last,
        name: fullName,
        gender: c.gender || 'male',
        dob: c.dob,
        cnic: c.cnic,
      });

      if (c.mobile) {
        await tx.insert(schema.contactPhones).values({
          id: crypto.randomUUID(),
          workspaceSubdomain: subdomain,
          contactId: pgId,
          number: c.mobile,
          label: 'Mobile',
          isPrimary: true,
        });
      }

      if (c.email) {
        await tx.insert(schema.contactEmails).values({
          id: crypto.randomUUID(),
          workspaceSubdomain: subdomain,
          contactId: pgId,
          address: c.email,
          label: 'Personal',
          isPrimary: true,
          isVerified: true,
        });
      }

      if (c.address) {
        await tx.insert(schema.contactAddresses).values({
          id: crypto.randomUUID(),
          workspaceSubdomain: subdomain,
          contactId: pgId,
          line1: c.address,
          label: 'Home',
          isPrimary: true,
        });
      }

      contactMap.set(c.id, pgId);
    }
    console.log(`✓ Migrated ${mysqlContacts.length} contacts.`);

    // 2. Users
    console.log('[ETL] Migrating users...');
    const [mysqlUsers] = await mysqlConn.query<any[]>('SELECT * FROM users');
    for (const u of mysqlUsers) {
      const pgId = crypto.randomUUID();
      const contactId = u.contact_id ? contactMap.get(u.contact_id) : null;
      await tx.insert(schema.tenantUsers).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        loginEmail: u.email,
        passwordHash: u.password_hash || u.password || 'dev-migrated-pass-hash',
        name: u.name,
        role: u.role || 'assistant_teacher',
        contactId: contactId,
        mustChangePassword: false,
      });
      userMap.set(u.id, pgId);
    }
    console.log(`✓ Migrated ${mysqlUsers.length} users.`);

    // 3. Teachers
    console.log('[ETL] Migrating teachers...');
    const [mysqlTeachers] = await mysqlConn.query<any[]>('SELECT * FROM teachers');
    for (const t of mysqlTeachers) {
      const pgId = crypto.randomUUID();
      const contactId = t.contact_id ? contactMap.get(t.contact_id) : null;
      if (!contactId) continue;

      await tx.insert(schema.teachers).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        contactId: contactId,
        status: t.status || 'active',
      });
      teacherMap.set(t.id, pgId);
    }
    console.log(`✓ Migrated ${teacherMap.size} teachers.`);

    // 4. Students
    console.log('[ETL] Migrating students...');
    const studentNameMap = new Map<string, { name: string; rollNo: string }>();
    const [mysqlStudents] = await mysqlConn.query<any[]>('SELECT * FROM students');
    for (const s of mysqlStudents) {
      const pgId = crypto.randomUUID();
      const contactId = s.contact_id ? contactMap.get(s.contact_id) : null;
      if (!contactId) continue;

      const contactObj = mysqlContacts.find(c => c.id === s.contact_id);
      const name = contactObj?.full_name || 'Unknown';

      await tx.insert(schema.students).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        contactId: contactId,
        grNumber: String(s.Id),
        studentId: String(s.Id),
        status: 'active',
      });
      studentMap.set(s.Id, pgId);
      studentNameMap.set(pgId, { name, rollNo: String(s.Id) });
    }
    console.log(`✓ Migrated ${studentMap.size} students.`);

    // 5. Sessions
    console.log('[ETL] Migrating academic sessions...');
    const [mysqlSessions] = await mysqlConn.query<any[]>('SELECT * FROM enrollmentsession');
    for (const sess of mysqlSessions) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.sessions).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        name: sess.Name || 'Academic Term',
        type: 'standard',
        status: sess.IsActive === '1' || sess.IsActive === 1 ? 'active' : 'inactive',
        startDate: formatDateString(sess.StartDate),
        endDate: formatDateString(sess.StartDate),
      });
      sessionMap.set(sess.Id, pgId);
    }
    console.log(`✓ Migrated ${mysqlSessions.length} academic sessions.`);

    // 6. Classes
    console.log('[ETL] Migrating classes...');
    const [mysqlClasses] = await mysqlConn.query<any[]>('SELECT * FROM classmanifest');
    // Get a fallback teacher ID if available
    const firstTeacherId = teacherMap.values().next().value || 'unassigned';

    for (const cl of mysqlClasses) {
      const pgId = crypto.randomUUID();
      const sessionId = cl.session_id ? sessionMap.get(cl.session_id) : null;
      if (!sessionId) continue;

      await tx.insert(schema.sessionClasses).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        sessionId: sessionId,
        name: cl.ClassName || cl.Class || 'Class',
        teacherId: firstTeacherId,
        capacity: cl.capacity || 40,
      });
      classMap.set(cl.id_auto_gen, pgId);
    }
    console.log(`✓ Migrated ${classMap.size} classes.`);

    // 7. Enrollments
    console.log('[ETL] Migrating student enrollments...');
    const [mysqlEnrollments] = await mysqlConn.query<any[]>('SELECT * FROM enrollment');
    let enrollmentCount = 0;
    for (const e of mysqlEnrollments) {
      const studentId = studentMap.get(e.StudentId);
      const classId = classMap.get(e.Class ? Number(e.Class) : 0);
      const sessionId = e.EnrollmentSessionId ? sessionMap.get(e.EnrollmentSessionId) : null;
      if (!studentId || !classId || !sessionId) continue;

      await tx.insert(schema.enrollments).values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        studentId: studentId,
        classId: classId,
        sessionId: sessionId,
        enrolledDate: formatDateString(e.EnrollmentDate),
        baseFee: '0.00',
        discountType: 'none',
        discountLabel: '',
        discountPct: '0.00',
        discountAmt: '0.00',
        finalFee: '0.00',
        status: e.IsActive === '0' ? 'inactive' : 'active',
      });
      enrollmentCount++;
    }
    console.log(`✓ Migrated ${enrollmentCount} enrollments.`);

    // 8. Timetable
    console.log('[ETL] Migrating timetable schedules...');
    const [mysqlTimetable] = await mysqlConn.query<any[]>('SELECT * FROM timetable');
    let timetableCount = 0;
    for (const tt of mysqlTimetable) {
      const classId = classMap.get(Number(tt.class_id));
      const sessionId = tt.session_id ? sessionMap.get(tt.session_id) : null;
      if (!classId || !sessionId) continue;

      const dayStr = (tt.day_of_week || 'Monday').slice(0, 10);

      await tx.insert(schema.sessionTimetable).values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        sessionId: sessionId,
        day: dayStr,
        activity: tt.subject || 'Islamic Studies',
        startTime: tt.start_time || '08:00',
        endTime: tt.end_time || '09:00',
        location: 'Classroom',
        type: 'class',
      });
      timetableCount++;
    }
    console.log(`✓ Migrated ${timetableCount} timetable schedules.`);

    // 9. Attendance (Batch Write)
    console.log('[ETL] Migrating attendance logs in batches...');
    const [mysqlAttendance] = await mysqlConn.query<any[]>(`
      SELECT a.id, a.date, a.status, e.StudentId, e.Class
      FROM attendance a
      JOIN enrollment e ON a.enrollment_id = e.Id
    `);
    const attendanceBatch: any[] = [];
    let attendanceInsertedCount = 0;

    for (const a of mysqlAttendance) {
      const studentId = studentMap.get(a.StudentId);
      const classId = classMap.get(Number(a.Class));
      if (!studentId || !classId) continue;

      const studentInfo = studentNameMap.get(studentId) || { name: 'Unknown Student', rollNo: '' };

      attendanceBatch.push({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        studentId: studentId,
        classId: classId,
        studentName: studentInfo.name,
        rollNo: studentInfo.rollNo,
        date: formatDateString(a.date),
        status: (a.status || 'present').toLowerCase(),
        timeIn: '',
        timeOut: '',
        notes: '',
      });
      attendanceInsertedCount++;

      if (attendanceBatch.length >= 2000) {
        await tx.insert(schema.attendance).values(attendanceBatch).onConflictDoNothing();
        attendanceBatch.length = 0;
      }
    }
    if (attendanceBatch.length > 0) {
      await tx.insert(schema.attendance).values(attendanceBatch).onConflictDoNothing();
    }
    console.log(`✓ Migrated ${attendanceInsertedCount} of ${mysqlAttendance.length} attendance records.`);

    // 10. Ledger Accounts & Accounting Vouchers
    console.log('[ETL] Migrating financial double-entry accounting ledgers...');
    const [mysqlFinAccounts] = await mysqlConn.query<any[]>('SELECT * FROM fin_accounts');
    for (const fa of mysqlFinAccounts) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.accountingAccounts).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        code: String(fa.AccountID),
        name: fa.AccountName || 'Account',
        type: fa.AccountType || 'Asset',
        subtype: '',
        description: '',
        isActive: true,
      });
      accountingAccountMap.set(fa.AccountID, pgId);
    }

    const [mysqlFinTransactions] = await mysqlConn.query<any[]>('SELECT * FROM fin_transactions');
    for (const ft of mysqlFinTransactions) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.accountingEntries).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        date: formatDateString(ft.TransactionDate),
        ref: 'MIG-' + ft.TransactionID,
        description: ft.Description || 'Ledger Entry',
        status: 'posted',
        fiscalYear: 'current',
      });
      accountingEntryMap.set(ft.TransactionID, pgId);
    }

    const [mysqlFinLedgerEntries] = await mysqlConn.query<any[]>('SELECT * FROM fin_ledger_entries');
    for (const fle of mysqlFinLedgerEntries) {
      const entryId = accountingEntryMap.get(fle.TransactionID);
      const accountId = accountingAccountMap.get(fle.AccountID);
      if (!entryId || !accountId) continue;

      await tx.insert(schema.accountingJournalLines).values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        entryId: entryId,
        accountId: accountId,
        debit: fle.Debit || '0.00',
        credit: fle.Credit || '0.00',
        description: fle.Description || '',
      });
    }
    console.log(`✓ Migrated general ledgers and journal entries.`);

    // 11. Student Billing & General Cash Flow
    console.log('[ETL] Migrating student monthly fee invoices...');
    const [mysqlMonthlyFees] = await mysqlConn.query<any[]>('SELECT * FROM monthly_fees');
    for (const mf of mysqlMonthlyFees) {
      const studentId = studentMap.get(mf.StudentID);
      if (!studentId) continue;

      const invoiceId = crypto.randomUUID();
      const amountStr = mf.Amount || '0.00';
      await tx.insert(schema.financeInvoices).values({
        id: invoiceId,
        workspaceSubdomain: subdomain,
        studentId: studentId,
        studentName: '',
        class: '',
        session: '',
        baseFee: amountStr,
        discountValue: '0.00',
        discountAmt: '0.00',
        finalAmt: amountStr,
        status: mf.Status === 'Paid' ? 'paid' : 'unpaid',
        dueDate: formatDateString(mf.DueDate),
      });

      if (mf.Status === 'Paid') {
        await tx.insert(schema.financePayments).values({
          id: crypto.randomUUID(),
          workspaceSubdomain: subdomain,
          invoiceId: invoiceId,
          studentId: studentId,
          amount: amountStr,
          date: formatDateString(mf.PaymentDate),
          method: mf.PaymentMethod || 'cash',
        });
      }
    }
    console.log(`✓ Migrated student billing logs.`);

    // 12. New Modules (Retail POS, Charity & Workshops)
    console.log('[ETL] Migrating new retail inventory module...');
    const [mysqlBookInventory] = await mysqlConn.query<any[]>('SELECT * FROM book_inventory');
    for (const bi of mysqlBookInventory) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.inventoryItems).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        name: bi.book_name,
        itemType: 'book',
        language: bi.language,
        totalStock: bi.total_stock || 0,
        remainingStock: bi.remaining_stock || 0,
        purchaseCost: bi.purchase_cost || '0.00',
        sellingPrice: bi.selling_price || '0.00',
      });
      inventoryItemMap.set(bi.id, pgId);
    }

    const [mysqlStationeryInventory] = await mysqlConn.query<any[]>('SELECT * FROM stationery_inventory');
    for (const si of mysqlStationeryInventory) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.inventoryItems).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        name: si.item_name || 'Stationery Item',
        itemType: 'stationery',
        totalStock: si.total_stock || 0,
        remainingStock: si.remaining_stock || 0,
        purchaseCost: si.purchase_cost || '0.00',
        sellingPrice: si.selling_price || '0.00',
      });
      inventoryItemMap.set(si.id, pgId);
    }

    const [mysqlBookSales] = await mysqlConn.query<any[]>('SELECT * FROM book_sales');
    for (const bs of mysqlBookSales) {
      const itemId = inventoryItemMap.get(bs.book_id);
      const studentId = bs.student_id ? studentMap.get(bs.student_id) : null;
      if (!itemId) continue;

      await tx.insert(schema.inventorySales).values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        itemId: itemId,
        studentId: studentId,
        buyerName: bs.buyer_name || 'Walk-in Buyer',
        qty: bs.qty || 1,
        totalPrice: bs.total_price || '0.00',
        saleDate: bs.sale_date || new Date(),
        status: bs.status || 'completed',
      });
    }

    console.log('[ETL] Migrating community charity drives and fatwa ticketing...');
    const [mysqlFundraisingCampaigns] = await mysqlConn.query<any[]>('SELECT * FROM lucky_draw_campaigns');
    for (const ldc of mysqlFundraisingCampaigns) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.fundraisingCampaigns).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        campaignName: ldc.campaign_name || 'Charity Drive',
        targetAmount: ldc.target_amount || '0.00',
        status: ldc.status || 'active',
      });
      fundraisingCampaignMap.set(ldc.id, pgId);
    }

    const [mysqlWorkshopEvents] = await mysqlConn.query<any[]>('SELECT * FROM workshop_events');
    for (const we of mysqlWorkshopEvents) {
      const pgId = crypto.randomUUID();
      await tx.insert(schema.workshopEvents).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        title: we.title || 'Workshop Event',
        description: we.description,
        startDate: we.start_date,
        endDate: we.end_date,
      });
      workshopEventMap.set(we.id, pgId);
    }

    const [mysqlWorkshopParticipants] = await mysqlConn.query<any[]>('SELECT * FROM workshop_participants');
    for (const wp of mysqlWorkshopParticipants) {
      const workshopId = workshopEventMap.get(wp.workshop_id);
      const contactId = contactMap.get(wp.contact_id);
      if (!workshopId || !contactId) continue;

      const pgId = crypto.randomUUID();
      await tx.insert(schema.workshopParticipants).values({
        id: pgId,
        workspaceSubdomain: subdomain,
        workshopId: workshopId,
        contactId: contactId,
        status: wp.status || 'registered',
      });
      workshopParticipantMap.set(wp.id, pgId);
    }

    const [mysqlWorkshopScores] = await mysqlConn.query<any[]>('SELECT * FROM workshop_scores');
    for (const ws of mysqlWorkshopScores) {
      const workshopId = workshopEventMap.get(ws.workshop_id);
      const participantId = workshopParticipantMap.get(ws.participant_id);
      if (!workshopId || !participantId) continue;

      await tx.insert(schema.workshopScores).values({
        id: crypto.randomUUID(),
        workspaceSubdomain: subdomain,
        workshopId: workshopId,
        participantId: participantId,
        criterionName: ws.criterion_name || 'Score',
        score: ws.score || '0.00',
        maxScore: ws.max_score || '100.00',
        remarks: ws.remarks,
      });
    }

    console.log('✓ Migrated new retail, charity, and workshop modules data.');
  });

  await mysqlConn.end();
  console.log('🎉 Data migration completed successfully! All data imported into Dar ul Quran workspace.');
}

runMigration()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration crashed:', err);
    await closeDatabase();
    process.exit(1);
  });
