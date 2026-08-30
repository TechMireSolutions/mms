import type { AppTranslationKey } from '@mms/shared';
import type { CustomCard } from '@/lib/reports/reportMetadata';

export function getDefaultCardConfig(
  category: string,
  cardId: string,
  title: string,
  titleKey?: AppTranslationKey,
): CustomCard {
  const config: CustomCard = {
    id: cardId,
    title,
    titleKey,
    collection: 'students',
    operation: 'count',
    filterField: 'status',
    filterOperator: 'equals',
    filterValue: 'active',
    icon: 'GraduationCap',
    color: 'emerald',
    subTextType: 'dynamic',
    fixedSubText: '',
  };

  switch (cardId) {
    case 'kpi-total-students':
      if (category === 'contacts') {
        Object.assign(config, { collection: 'contacts', filterField: '', icon: 'Users', color: 'blue' });
      }
      break;
    case 'kpi-avg-attendance':
      Object.assign(config, { collection: 'attendance_records', operation: 'percentage', filterValue: 'present', icon: 'UserCheck' });
      break;
    case 'kpi-fee-collected':
      Object.assign(config, { collection: 'finance_invoices', operation: 'sum', targetField: 'finalAmt', filterValue: 'paid', icon: 'DollarSign', color: 'blue' });
      break;
    case 'kpi-outstanding':
      Object.assign(config, { collection: 'finance_invoices', operation: 'sum', targetField: 'finalAmt', filterValue: 'unpaid', icon: 'AlertCircle', color: 'red' });
      break;
    case 'kpi-hasanat-awarded':
      Object.assign(config, { collection: 'hasanat_distributions', operation: 'sum', targetField: 'points', filterField: '', icon: 'Star', color: 'amber' });
      break;
    case 'kpi-pass-rate':
      Object.assign(config, { operation: 'percentage', icon: 'GraduationCap', color: 'violet' });
      break;
    case 'kpi-capacity-used':
      Object.assign(config, { collection: 'sessions', operation: 'percentage', icon: 'BarChart2', color: 'blue' });
      break;
    case 'kpi-growth-rate':
      Object.assign(config, { collection: 'contacts', filterField: '', icon: 'TrendingUp' });
      break;
    case 'kpi-whatsapp-verified':
      Object.assign(config, { collection: 'contacts', operation: 'percentage', filterField: 'whatsappStatus', filterValue: 'REGISTERED', icon: 'MessageCircle', color: 'amber' });
      break;
    case 'kpi-active-contacts':
      Object.assign(config, { collection: 'contacts', operation: 'percentage', filterField: 'isActive', filterValue: 'true', icon: 'UserCheck', color: 'green' });
      break;
    case 'kpi-total-contacts':
      Object.assign(config, { collection: 'contacts', filterField: '', icon: 'Users', color: 'blue' });
      break;
    case 'kpi-total-questions':
      Object.assign(config, { collection: 'questions', filterField: '', icon: 'BarChart2', color: 'blue' });
      break;
    case 'kpi-generated-tests':
      Object.assign(config, { collection: 'tests', filterField: '', icon: 'CalendarCheck', color: 'blue' });
      break;
    case 'kpi-test-submissions':
      Object.assign(config, { collection: 'assessment_results', filterField: '', icon: 'UserCheck', color: 'violet' });
      break;
    case 'kpi-avg-test-score':
      Object.assign(config, { collection: 'assessment_results', operation: 'percentage', filterField: '', icon: 'Target', color: 'green' });
      break;
    case 'kpi-total-faculty':
      Object.assign(config, { collection: 'teachers', icon: 'GraduationCap', color: 'primary' });
      break;
    case 'kpi-on-leave':
      Object.assign(config, { collection: 'teachers', filterValue: 'on_leave', icon: 'Activity', color: 'amber' });
      break;
    case 'kpi-obligations-total':
      Object.assign(config, { icon: 'Receipt', color: 'primary' });
      break;
    case 'kpi-obligations-amount':
      Object.assign(config, { icon: 'TrendingUp', color: 'emerald' });
      break;
    case 'kpi-accounting-entries':
      Object.assign(config, { icon: 'Receipt', color: 'primary' });
      break;
    case 'kpi-accounting-surplus':
      Object.assign(config, { icon: 'DollarSign', color: 'emerald' });
      break;
    case 'kpi-users-total':
      Object.assign(config, { icon: 'Users', color: 'primary' });
      break;
    case 'kpi-users-sessions':
      Object.assign(config, { icon: 'ShieldCheck', color: 'blue' });
      break;
    case 'kpi-messaging-total':
      Object.assign(config, { icon: 'MessageSquare', color: 'primary' });
      break;
    case 'kpi-messaging-whatsapp':
      Object.assign(config, { icon: 'MessageCircle', color: 'emerald' });
      break;
  }
  return config;
}

export function getDefaultKPICollection(category: string): CustomCard['collection'] {
  if (category === 'contacts') return 'contacts';
  if (category === 'attendance') return 'attendance_records';
  if (category === 'financial' || category === 'accounting' || category === 'finance') return 'finance_invoices';
  if (category === 'hasanat') return 'hasanat_distributions';
  if (category === 'sessions') return 'sessions';
  if (category === 'enrollments') return 'enrollments';
  if (category === 'questionBank') return 'questions';
  if (category === 'teachers' || category === 'faculty') return 'teachers';
  return 'students';
}

export function getCategoryLabelKey(category: string): AppTranslationKey | undefined {
  const keys: Partial<Record<string, AppTranslationKey>> = {
    contacts: 'nav.contacts',
    students: 'nav.students',
    attendance: 'nav.attendance',
    financial: 'nav.finance',
    finance: 'nav.finance',
    hasanat: 'nav.hasanatCards',
    sessions: 'nav.sessions',
    examinations: 'nav.examinations',
    questionBank: 'nav.questionBank',
    enrollments: 'nav.enrollments',
    faculty: 'nav.teachers',
    teachers: 'nav.teachers',
    accounting: 'nav.accounting',
    obligations: 'nav.obligations',
    messaging: 'nav.messaging',
    users: 'nav.users',
  };
  return keys[category];
}
