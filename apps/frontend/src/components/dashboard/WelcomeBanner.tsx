import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";
import { getIntlLocaleForLanguage } from "@mms/shared";
import type { AppTranslationKey } from "@mms/shared";
import { SESSIONS_DATA } from '@/lib/data/sessionsData';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useStudentsCollection } from "../../hooks/useStudents";
import useTranslation from "@/hooks/useTranslation";

interface WelcomeBannerProps {
  role?: "admin" | "teacher" | "accountant" | string;
}

const GREETING_BY_ROLE: Record<string, AppTranslationKey> = {
  teacher: "dashboard.greeting.teacher",
  accountant: "dashboard.greeting.accountant",
  admin: "dashboard.greeting.admin",
};

const BADGE_BY_ROLE: Record<string, AppTranslationKey> = {
  teacher: "dashboard.badge.teacher",
  accountant: "dashboard.badge.accountant",
  admin: "dashboard.badge.admin",
};

/**
 * Dashboard welcome header with role-specific messaging and localized date.
 */
export default function WelcomeBanner({ role = "admin" }: WelcomeBannerProps): React.JSX.Element {
  const { t, language } = useTranslation();
  const sessions = useLiveCollection("sessions", SESSIONS_DATA);
  const students = useStudentsCollection();
  const normalizedRole = (role ?? "admin").toLowerCase();
  const greetingKey = GREETING_BY_ROLE[normalizedRole] ?? "dashboard.greeting.admin";
  const badgeKey = BADGE_BY_ROLE[normalizedRole] ?? "dashboard.badge.admin";

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(getIntlLocaleForLanguage(language), {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [language]
  );

  let subtitle = t("dashboard.overview");

  if (normalizedRole === "teacher") {
    const teacherSessionsCount = sessions.filter((s) =>
      (s.classes || []).some((c: { teacherId?: string; teacherName?: string }) => c.teacherId === "t1" || c.teacherName?.includes("Ibrahim"))
    ).length;
    subtitle = teacherSessionsCount === 1
      ? t("dashboard.sessionsTodayOne")
      : t("dashboard.sessionsToday", { count: teacherSessionsCount });
  } else if (normalizedRole === "admin") {
    const activeCount = students.filter((s) => s.status === "active").length;
    subtitle = t("dashboard.overview");
    if (activeCount > 0) {
      subtitle = `${t("dashboard.overview")} (${activeCount})`;
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-emerald-800 to-emerald-900 p-6 md:p-7 text-primary-foreground"
    >
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full border border-white/[0.07]" aria-hidden="true" />
      <div className="absolute -top-12 -right-4  w-48 h-48 rounded-full border border-white/[0.05]" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full border border-white/[0.04] translate-y-1/2" aria-hidden="true" />

      <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 opacity-[0.07]" viewBox="0 0 200 200" fill="white" aria-hidden="true">
        <polygon points="100,10 118,70 180,70 130,108 148,168 100,132 52,168 70,108 20,70 82,70" />
        <polygon points="100,30 112,72 158,72 122,98 134,140 100,116 66,140 78,98 42,72 88,72" />
      </svg>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{t(badgeKey)}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight m-0">{t(greetingKey)}</h1>
          <p className="text-sm text-white/65 mt-1 max-w-lg mb-0">{subtitle}</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-white/70" aria-hidden="true" />
          <span className="text-[12px] font-medium text-white/80 whitespace-nowrap">{today}</span>
        </div>
      </div>
    </motion.header>
  );
}
