import React, { useMemo } from "react";
import { Users, LucideIcon, Zap } from "lucide-react";
import { Contact } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";

interface ContactStatsBarProps {
  contacts: Contact[];
}

export default function ContactStatsBar({ contacts }: ContactStatsBarProps): React.JSX.Element | null {
  const { uiStrings } = useContactConfig();
  const { t } = useTranslation();

  const stats = useMemo(() => {
    let withPhone = 0;
    let active = 0;
    let withWhatsApp = 0;

    contacts.forEach((c) => {
      if ((c.phones || []).length > 0 || c.phone) withPhone++;
      if (c.isActive !== false) active++;
      if (c.whatsappStatus === "REGISTERED") withWhatsApp++;
    });

    return { withPhone, active, withWhatsApp };
  }, [contacts]);

  const total = contacts.length;
  if (total === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard
        icon={Users}
        label={t("contacts.totalContacts")}
        value={total}
        sub={`${stats.active} ${t("contacts.activeProfiles")}`}
        color="text-primary"
        bg="bg-primary/10"
      />
      <StatCard
        icon={Zap}
        label={t("contacts.whatsappActive")}
        value={stats.withWhatsApp}
        sub={`${stats.withPhone} ${t("contacts.verifiedPhones")}`}
        color={uiStrings.healthClassHigh || "text-success"}
        bg="bg-success/10 border border-success/30"
      />
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  bg: string;
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: StatCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 text-left">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {label} · <span className="font-medium">{sub}</span>
        </p>
      </div>
    </div>
  );
}
