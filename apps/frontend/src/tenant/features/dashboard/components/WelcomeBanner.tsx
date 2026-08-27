import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { formatDayName, formatLongDate, formatHijriDate } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { SectionLabel } from '@/components/ui/SectionLabel';
import {
  DASHBOARD_ROLE_GREETING_KEYS,
  DASHBOARD_ROLE_BADGE_KEYS,
  resolveDashboardWelcomeSubtitle,
  type DashboardRole,
} from '@/lib/dashboardRole';

interface WelcomeBannerProps {
  dashboardRole: DashboardRole;
  /** Active sessions from server metrics (teacher subtitle). */
  activeSessionsCount: number;
  /** Active student count from student metrics (admin subtitle). */
  activeStudentCount: number;
}

const DATE_CHIP_CLASS =
  'surface-glass bg-primary-foreground/10 hover:bg-primary-foreground/15 border-primary-foreground/20 rounded-xl px-4 py-2.5 transition-all duration-300 flex items-center gap-2 shadow-sm print:bg-transparent print:border-border print:text-black print:shadow-none';

/** Dashboard welcome header with dashboardRole-specific messaging and localized date. */
export function WelcomeBanner({
  dashboardRole,
  activeSessionsCount,
  activeStudentCount,
}: WelcomeBannerProps): React.JSX.Element {

  const { t } = useTranslation();
  const { user } = useAuth();

  const now = useMemo(() => new Date(), []);
  const dayName = useMemo(() => formatDayName(now), [now]);
  const gregDate = useMemo(() => formatLongDate(now), [now]);
  const hijriDate = useMemo(() => formatHijriDate(now), [now]);

  const userName = user?.name ?? '';

  const subtitle = useMemo(
    () =>
      resolveDashboardWelcomeSubtitle(
        dashboardRole,
        { activeSessionsCount, activeStudentCount },
        t,
      ),
    [dashboardRole, activeSessionsCount, activeStudentCount, t],
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg shadow-primary/10 print:bg-none print:bg-card print:text-foreground print:border print:border-border print:shadow-none print:p-4"
    >
      <div className="absolute inset-0 islamic-pattern opacity-5 mix-blend-overlay pointer-events-none print:hidden" aria-hidden="true" />
      <div className="absolute -top-24 -end-16 w-80 h-80 rounded-full bg-secondary/15 blur-3xl opacity-70 pointer-events-none print:hidden" aria-hidden="true" />
      <div className="absolute -bottom-20 -start-16 w-72 h-72 rounded-full bg-warning/10 blur-3xl opacity-50 pointer-events-none print:hidden" aria-hidden="true" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse print:hidden" aria-hidden="true" />
            <SectionLabel toneClassName="text-primary-foreground/70 print:text-muted-foreground">
              {t(DASHBOARD_ROLE_BADGE_KEYS[dashboardRole])}
            </SectionLabel>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight m-0 text-primary-foreground print:text-foreground">
            {userName ? t('dashboard.greeting.personal', { name: userName }) : t(DASHBOARD_ROLE_GREETING_KEYS[dashboardRole])}
          </h1>
          <p className="text-xs md:text-sm text-primary-foreground/75 mt-2 max-w-lg mb-0 font-medium leading-relaxed print:text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 self-start lg:self-auto flex-wrap">
          <div className={DATE_CHIP_CLASS}>
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse print:hidden" aria-hidden="true" />
            <span className="text-sm font-bold text-primary-foreground print:text-foreground whitespace-nowrap tracking-wide">{dayName}</span>
          </div>
          <div className={DATE_CHIP_CLASS}>
            <span className="w-1.5 h-1.5 rounded-full bg-info print:hidden" aria-hidden="true" />
            <span className="text-sm font-bold text-primary-foreground print:text-foreground whitespace-nowrap tracking-wide">{gregDate}</span>
          </div>
          {hijriDate ? (
            <div className={DATE_CHIP_CLASS}>
              <span className="w-1.5 h-1.5 rounded-full bg-success print:hidden" aria-hidden="true" />
              <span className="text-sm font-bold text-primary-foreground print:text-foreground whitespace-nowrap tracking-wide">{hijriDate}</span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}

export default WelcomeBanner;
