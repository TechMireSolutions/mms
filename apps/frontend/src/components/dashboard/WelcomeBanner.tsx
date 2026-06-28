import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getIntlLocaleForLanguage } from '@mms/shared';
import type { AppTranslationKey } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useStudentsMetrics } from '@/hooks/useStudents';
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
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const sessions = useSessionsCollection({ enabled: true });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: dashboardRole === 'admin' });

  const locale = getIntlLocaleForLanguage(language);
  const dayName = useMemo(() => {
    return new Date().toLocaleDateString(locale, { weekday: 'long' });
  }, [locale]);

  const gregDate = useMemo(() => {
    return new Date().toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [locale]);

  const hijriDate = useMemo(() => {
    try {
      return new Date().toLocaleDateString(locale + '-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [locale]);

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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/75 p-6 md:p-7 text-primary-foreground"
    >
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full border border-white/[0.07]" aria-hidden="true" />
      <div className="absolute -top-12 -right-4 w-48 h-48 rounded-full border border-white/[0.05]" aria-hidden="true" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              {t(BADGE_BY_ROLE[dashboardRole])}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight m-0">
            {userName ? `Assalamu Alaikum, ${userName}` : t(GREETING_BY_ROLE[dashboardRole])}
          </h1>
          <p className="text-sm text-white/65 mt-1 max-w-lg mb-0">{subtitle}</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Box 1: Weekday (Warning/Gold-tint frost) */}
          <div
            className="bg-warning/20 backdrop-blur-sm border border-warning/30 rounded-xl px-4 py-2.5"
          >
            <span className="text-[12px] font-bold text-white whitespace-nowrap">{dayName}</span>
          </div>
          {/* Box 2: Gregorian Date (Info/Blue-tint frost) */}
          <div
            className="bg-info/20 backdrop-blur-sm border border-info/30 rounded-xl px-4 py-2.5"
          >
            <span className="text-[12px] font-bold text-white whitespace-nowrap">{gregDate}</span>
          </div>
          {/* Box 3: Hijri Date (Secondary/Emerald-tint frost) */}
          {hijriDate && (
            <div
              className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 rounded-xl px-4 py-2.5"
            >
              <span className="text-[12px] font-bold text-white whitespace-nowrap">{hijriDate}</span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
