import { ROUTES } from '@/lib/config/routes';
import { isCurrentHostApex } from '@/lib/config/tenantConfig';

const TENANT_ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  [ROUTES.home]: () => import('@/pages/Dashboard'),
  [ROUTES.contacts]: () => import('@/pages/Contacts'),
  [ROUTES.students]: () => import('@/pages/Students'),
  [ROUTES.teachers]: () => import('@/pages/Teachers'),
  [ROUTES.enrollments]: () => import('@/pages/Enrollments'),
  [ROUTES.sessions]: () => import('@/pages/Sessions'),
  [ROUTES.attendance]: () => import('@/pages/Attendance'),
  [ROUTES.finance]: () => import('@/pages/Finance'),
  [ROUTES.hasanatCards]: () => import('@/pages/HasanatCards'),
  [ROUTES.examinations]: () => import('@/pages/Examinations'),
  [ROUTES.questionBank]: () => import('@/pages/QuestionBank'),
  [ROUTES.accounting]: () => import('@/pages/Accounting'),
  [ROUTES.obligations]: () => import('@/pages/Obligations'),
  [ROUTES.users]: () => import('@/pages/Users'),
  [ROUTES.settings]: () => import('@/pages/Settings'),
};

const APEX_ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  [ROUTES.home]: () => import('@/platform/pages/ApexHome'),
  [ROUTES.onboarding]: () => import('@/platform/pages/onboarding/OnboardingWizard'),
  [ROUTES.platformAccount]: () => import('@/platform/pages/PlatformAccount'),
  [ROUTES.platformForgotPassword]: () => import('@/platform/pages/auth/PlatformForgotPassword'),
};

const prefetched = new Set<string>();

function loadersForCurrentHost(): Record<string, () => Promise<unknown>> {
  return isCurrentHostApex() ? APEX_ROUTE_LOADERS : TENANT_ROUTE_LOADERS;
}

/** Warm the JS chunk for a route path (idempotent, host-aware). */
export function prefetchRoute(path: string): void {
  const loader = loadersForCurrentHost()[path];
  if (!loader || prefetched.has(path)) {
    return;
  }
  prefetched.add(path);
  void loader();
}
