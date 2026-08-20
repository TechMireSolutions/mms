import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  Calendar,
  ClipboardCheck,
  DollarSign,
  Award,
  FileText,
  HelpCircle,
  Calculator,
  ShieldAlert,
  MessageSquare,
  UserCog,
  Settings,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  categoryKey: string;
  fallbackCategory: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    fallbackLabel: "Dashboard",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.home,
    icon: LayoutDashboard,
    keywords: ["home", "analytics", "kpi", "metrics", "dashboard"],
  },
  {
    id: "contacts",
    labelKey: "nav.contacts",
    fallbackLabel: "Contacts",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.contacts,
    icon: Users,
    keywords: ["contacts", "directory", "people", "guardian", "phone"],
  },
  {
    id: "students",
    labelKey: "nav.students",
    fallbackLabel: "Students",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.students,
    icon: GraduationCap,
    keywords: ["students", "pupils", "learners", "class", "grade"],
  },
  {
    id: "teachers",
    labelKey: "nav.teachers",
    fallbackLabel: "Teachers",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.teachers,
    icon: UserCheck,
    keywords: ["teachers", "faculty", "instructors", "staff"],
  },
  {
    id: "enrollments",
    labelKey: "nav.enrollments",
    fallbackLabel: "Enrollments",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.enrollments,
    icon: BookOpen,
    keywords: ["enrollments", "admissions", "classes", "registration"],
  },
  {
    id: "sessions",
    labelKey: "nav.sessions",
    fallbackLabel: "Sessions",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.sessions,
    icon: Calendar,
    keywords: ["sessions", "timetable", "schedule", "term"],
  },
  {
    id: "attendance",
    labelKey: "nav.attendance",
    fallbackLabel: "Attendance",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.attendance,
    icon: ClipboardCheck,
    keywords: ["attendance", "present", "absent", "tardy", "rollcall"],
  },
  {
    id: "finance",
    labelKey: "nav.finance",
    fallbackLabel: "Finance",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.finance,
    icon: DollarSign,
    keywords: ["finance", "fees", "invoices", "payments", "dues", "billing"],
  },
  {
    id: "hasanatCards",
    labelKey: "nav.hasanatCards",
    fallbackLabel: "Hasanat Cards",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.hasanatCards,
    icon: Award,
    keywords: ["hasanat", "cards", "rewards", "merit", "points"],
  },
  {
    id: "examinations",
    labelKey: "nav.examinations",
    fallbackLabel: "Examinations",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.examinations,
    icon: FileText,
    keywords: ["examinations", "exams", "grades", "marks", "tests", "results"],
  },
  {
    id: "questionBank",
    labelKey: "nav.questionBank",
    fallbackLabel: "Question Bank",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.questionBank,
    icon: HelpCircle,
    keywords: ["question bank", "questions", "quiz", "assessment"],
  },
  {
    id: "accounting",
    labelKey: "nav.accounting",
    fallbackLabel: "Accounting",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.accounting,
    icon: Calculator,
    keywords: ["accounting", "ledger", "journal", "expenses", "revenue"],
  },
  {
    id: "obligations",
    labelKey: "nav.obligations",
    fallbackLabel: "Obligations",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.obligations,
    icon: ShieldAlert,
    keywords: ["obligations", "compliance", "dues", "liabilities"],
  },
  {
    id: "messaging",
    labelKey: "nav.messaging",
    fallbackLabel: "Messaging",
    categoryKey: "nav.modules",
    fallbackCategory: "Navigation",
    path: ROUTES.messaging,
    icon: MessageSquare,
    keywords: ["messaging", "sms", "whatsapp", "notifications", "broadcast"],
  },
  {
    id: "users",
    labelKey: "nav.users",
    fallbackLabel: "Users",
    categoryKey: "nav.system",
    fallbackCategory: "System",
    path: ROUTES.users,
    icon: UserCog,
    keywords: ["users", "admins", "staff", "permissions", "roles"],
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    fallbackLabel: "Settings",
    categoryKey: "nav.system",
    fallbackCategory: "System",
    path: ROUTES.settings,
    icon: Settings,
    keywords: ["settings", "branding", "theme", "backup", "configuration"],
  },
  {
    id: "profile",
    labelKey: "account.title",
    fallbackLabel: "Account Profile",
    categoryKey: "nav.system",
    fallbackCategory: "System",
    path: ROUTES.profile,
    icon: User,
    keywords: ["profile", "account", "password", "security", "me"],
  },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const translate = useCallback(
    (key: string) => {
      try {
        const val = (t as unknown as (k: string) => string)(key);
        return typeof val === "string" && val ? val : "";
      } catch {
        return "";
      }
    },
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter((item) => {
      const translatedLabel = translate(item.labelKey) || item.fallbackLabel;
      return (
        translatedLabel.toLowerCase().includes(q) ||
        item.fallbackLabel.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, translate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (path: string) => {
      onClose();
      setQuery("");
      navigate(path);
    },
    [navigate, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredItems, selectedIndex, handleSelect, onClose],
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-modal flex items-start justify-center pt-16 px-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-surface-lg surface-glass"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={translate("nav.globalSearchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-0 shadow-none focus-visible:ring-0 px-0 h-9"
              aria-label={translate("nav.globalSearchPlaceholder")}
              role="combobox"
              aria-expanded={open}
              aria-controls="tenant-command-listbox"
              aria-activedescendant={
                filteredItems[selectedIndex] ? `tenant-cmd-item-${filteredItems[selectedIndex].id}` : undefined
              }
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground select-none">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2" role="listbox" id="tenant-command-listbox">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("nav.globalSearchNoResults", { query })}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                const translatedLabel = translate(item.labelKey) || item.fallbackLabel;

                return (
                  <button
                    key={item.id}
                    id={`tenant-cmd-item-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-foreground hover:bg-muted/70",
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5 shrink-0", isSelected ? "text-primary-foreground" : "text-muted-foreground")} aria-hidden="true" />
                    <span className="flex-1 truncate">{translatedLabel}</span>
                    <span className={cn("text-xs opacity-70", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      {item.path}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
