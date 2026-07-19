import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { formatDayName, formatLongDate, formatHijriDate } from '@mms/shared';
import type { AppTranslationKey } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useStudentsMetrics } from '@/tenant/features/students/hooks/useStudents';
import { useTranslation } from '@/hooks/useTranslation';
import type { DashboardRole } from '@/lib/dashboardRole';

interface WelcomeBannerProps {
  dashboardRole: DashboardRole;
}

const GREETING_BY_ROLE: Record<DashboardRole, AppTranslationKey> = {
  teacher: 'dashboard.greeting.teacher',
  accountant: 'dashboard.greeting.accountant',
  admin: 'dashboard.greeting.admin',
};

const BADGE_BY_ROLE: Record<DashboardRole, AppTranslationKey> = {
  teacher: 'dashboard.badge.teacher',
  accountant: 'dashboard.badge.accountant',
  admin: 'dashboard.badge.admin',
};

/** Dashboard welcome header with dashboardRole-specific messaging and localized date. */
export default function WelcomeBanner({ dashboardRole }: WelcomeBannerProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const sessions = useSessionsCollection({ enabled: true });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: dashboardRole === 'admin' });

  const dayName = useMemo(() => {
    return formatDayName(new Date());
  }, []);

  const gregDate = useMemo(() => {
    return formatLongDate(new Date());
  }, []);

  const hijriDate = useMemo(() => {
    return formatHijriDate(new Date());
  }, []);

  const userId = user?.id ?? '';
  const userName = user?.name ?? '';

  let subtitle = t('dashboard.overview');

  if (dashboardRole === 'teacher') {
    const teacherSessionsCount = sessions.filter((session) =>
      (session.classes || []).some(
        (sessionClass) =>
          sessionClass.teacherId === userId ||
          (userName && String(sessionClass.teacherName || '').toLowerCase() === userName.toLowerCase()),
      ),
    ).length;
    subtitle =
      teacherSessionsCount === 1
        ? t('dashboard.sessionsTodayOne')
        : t('dashboard.sessionsToday', { count: teacherSessionsCount });
  } else if (dashboardRole === 'admin') {
    const activeCount = studentMetrics?.active ?? 0;
    if (activeCount > 0) {
      subtitle = t('dashboard.overviewActiveStudents', { count: activeCount });
    }
  } else if (dashboardRole === 'accountant') {
    subtitle = t('dashboard.accountantOverview');
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg shadow-primary/10"
    >
      {/* Glow effects & Islamic pattern */}
      <div className="absolute inset-0 islamic-pattern opacity-[0.06] mix-blend-overlay pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-secondary/15 blur-3xl opacity-70 pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-warning/10 blur-3xl opacity-50 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
              {t(BADGE_BY_ROLE[dashboardRole])}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight m-0 text-white">
            {userName ? t('dashboard.greeting.personal', { name: userName }) : t(GREETING_BY_ROLE[dashboardRole])}
          </h1>
          <p className="text-xs md:text-sm text-white/75 mt-2 max-w-lg mb-0 font-medium leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 self-start lg:self-auto flex-wrap">
          {/* Box 1: Weekday */}
          <div
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 transition-all duration-300 flex items-center gap-2 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            <span className="text-[12px] font-bold text-white whitespace-nowrap tracking-wide">{dayName}</span>
          </div>
          
          {/* Box 2: Gregorian Date */}
          <div
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 transition-all duration-300 flex items-center gap-2 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-info" aria-hidden="true" />
            <span className="text-[12px] font-bold text-white whitespace-nowrap tracking-wide">{gregDate}</span>
          </div>
          
          {/* Box 3: Hijri Date */}
          {hijriDate && (
            <div
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
              <span className="text-[12px] font-bold text-white whitespace-nowrap tracking-wide">{hijriDate}</span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

