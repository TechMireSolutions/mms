import { describe, expect, it } from 'vitest';
import {
  computeStudentsCommandMetrics,
  computeTeachersCommandMetrics,
  computeFinanceCommandMetrics,
  computeSessionsCommandMetrics,
  computeEnrollmentsCommandMetrics,
  computeObligationsCommandMetrics,
  computeAccountingCommandMetrics,
  computeHasanatCommandMetrics,
  computeAttendanceCommandMetrics,
  computeExaminationsCommandMetrics,
  computeQuestionBankCommandMetrics,
} from '../moduleCommandMetrics.js';

describe('moduleCommandMetrics', () => {
  it('computes student metrics breakdown correctly', () => {
    const students = [
      { status: 'active', registeredDate: new Date().toISOString() },
      { status: 'active', registeredDate: '2020-01-01' },
      { status: 'inactive' },
      { status: 'suspended' },
    ];

    const metrics = computeStudentsCommandMetrics(students);
    expect(metrics.total).toBe(4);
    expect(metrics.active).toBe(2);
    expect(metrics.inactive).toBe(1);
    expect(metrics.suspended).toBe(1);
    expect(metrics.newThisPeriod).toBe(1);
  });

  it('computes teacher metrics breakdown correctly', () => {
    const teachers = [
      { status: 'active', joinDate: new Date().toISOString() },
      { status: 'on_leave', joinDate: '2021-05-10' },
      { status: 'inactive' },
    ];

    const metrics = computeTeachersCommandMetrics(teachers);
    expect(metrics.total).toBe(3);
    expect(metrics.active).toBe(1);
    expect(metrics.onLeave).toBe(1);
    expect(metrics.inactive).toBe(1);
    expect(metrics.newThisPeriod).toBe(1);
  });

  it('computes finance metrics breakdown correctly', () => {
    const invoices = [
      { status: 'paid' },
      { status: 'overdue' },
      { status: 'pending' },
      { status: 'partial' },
    ];
    const payments = [{ id: 'p-1' }, { id: 'p-2' }];

    const metrics = computeFinanceCommandMetrics(invoices, payments);
    expect(metrics.totalInvoices).toBe(4);
    expect(metrics.paid).toBe(1);
    expect(metrics.overdue).toBe(1);
    expect(metrics.outstanding).toBe(3); // pending, overdue, partial
    expect(metrics.totalPayments).toBe(2);
  });

  it('computes sessions metrics and total capacity/enrollments', () => {
    const sessions = [
      {
        status: 'active',
        classes: [
          { enrolled: 15, capacity: 20 },
          { enrolled: 10, capacity: 15 },
        ],
      },
      {
        status: 'upcoming',
        classes: [{ enrolled: 5, capacity: 10 }],
      },
    ];

    const metrics = computeSessionsCommandMetrics(sessions);
    expect(metrics.total).toBe(2);
    expect(metrics.active).toBe(1);
    expect(metrics.upcoming).toBe(1);
    expect(metrics.totalEnrolled).toBe(30);
    expect(metrics.totalCapacity).toBe(45);
  });

  it('computes enrollments metrics and total revenue', () => {
    const enrollments = [
      { status: 'confirmed', finalFee: 1500, enrolledDate: new Date().toISOString() },
      { status: 'confirmed', finalFee: 2000 },
      { status: 'cancelled', finalFee: 1000 },
    ];

    const metrics = computeEnrollmentsCommandMetrics(enrollments);
    expect(metrics.total).toBe(3);
    expect(metrics.confirmed).toBe(2);
    expect(metrics.cancelled).toBe(1);
    expect(metrics.revenue).toBe(3500); // 1500 + 2000 (cancelled excluded)
    expect(metrics.newThisPeriod).toBe(1);
  });

  it('computes accounting metrics and volume', () => {
    const entries = [
      {
        status: 'posted',
        date: new Date().toISOString(),
        lines: [{ debit: 500 }, { debit: 500 }],
      },
      { status: 'draft', date: '2024-01-01' },
    ];
    const accounts = [{ isActive: true }, { isActive: true }, { isActive: false }];

    const metrics = computeAccountingCommandMetrics(entries, accounts);
    expect(metrics.totalEntries).toBe(2);
    expect(metrics.posted).toBe(1);
    expect(metrics.draft).toBe(1);
    expect(metrics.activeAccounts).toBe(2);
    expect(metrics.inactiveAccounts).toBe(1);
    expect(metrics.postedVolume).toBe(1000);
  });
});
