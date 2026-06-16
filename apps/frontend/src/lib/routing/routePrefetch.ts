import { ROUTES } from '@/lib/config/routes';

/** Lazy route loaders — mirrors HostRoutes.tsx for hover/focus prefetch. */
const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  [ROUTES.home]: () => import('@/pages/Dashboard'),
  [ROUTES.contacts]: () => import('@/pages/Contacts'),
  [ROUTES.students]: () => import('@/pages/Students'),
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

const prefetched = new Set<string>();

/** Warm the JS chunk for a route path (idempotent). */
export function prefetchRoute(path: string): void {
  const loader = ROUTE_LOADERS[path];
  if (!loader || prefetched.has(path)) {
    return;
  }
  prefetched.add(path);
  void loader();
}
