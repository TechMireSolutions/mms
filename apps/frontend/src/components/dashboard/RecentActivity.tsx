import React from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle, DollarSign, BookOpen } from "lucide-react";

interface ActivityItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  time: string;
  color: string;
}

const activities: ActivityItem[] = [
  { icon: UserPlus, title: "New student registered", desc: "Yusuf Ahmad joined Quran Hifz Program", time: "2 min ago", color: "text-primary" },
  { icon: CheckCircle, title: "Attendance marked", desc: "Session B - Morning Tajweed Class", time: "15 min ago", color: "text-success" },
  { icon: DollarSign, title: "Payment received", desc: "$150 - Monthly fee from Aisha Khan", time: "1 hour ago", color: "text-warning" },
  { icon: BookOpen, title: "Exam completed", desc: "Surah Al-Baqarah memorization test", time: "3 hours ago", color: "text-info" },
];

/**
 * RecentActivity Component
 *
 * Displays a timeline of recent system events and user activities.
 *
 * @returns {React.ReactElement} The recent activity widget.
 */
export default function RecentActivity() {
  return (
    <motion.section
      aria-labelledby="recent-activity-heading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-card rounded-xl border border-border"
    >
      <header className="px-5 py-4 border-b border-border">
        <h3 id="recent-activity-heading" className="text-sm font-semibold text-foreground m-0">Recent Activity</h3>
      </header>
      <div className="divide-y divide-border/50">
        {activities.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <article key={i} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <Icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground m-0">{activity.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">{activity.desc}</p>
              </div>
              <span className="text-[11px] text-muted-foreground/60 flex-shrink-0" aria-label={`Occurred ${activity.time}`}>{activity.time}</span>
            </article>
          );
        })}
      </div>
      <footer className="px-5 py-3 border-t border-border">
        <button className="text-xs text-primary font-medium hover:underline">
          View all activity
        </button>
      </footer>
    </motion.section>
  );
}
