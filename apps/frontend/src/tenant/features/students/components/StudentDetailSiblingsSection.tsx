import React from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

export interface SiblingStudentItem {
  id: string;
  name: string;
  grNumber?: string;
  status?: string;
  gender?: string;
  sessionNames: string[];
}

interface StudentDetailSiblingsSectionProps {
  siblings: SiblingStudentItem[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  onViewSibling?: (siblingId: string) => void;
}

export function StudentDetailSiblingsSection({
  siblings,
  statusBadgeConfig,
  onViewSibling,
}: StudentDetailSiblingsSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (siblings.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <DetailSectionTitle>
        {t("students.detail.siblings")} ({siblings.length})
      </DetailSectionTitle>

      <Card accentColor="success" className="divide-y divide-border/50 p-0">
        {siblings.map((sibling) => (
          <div
            key={sibling.id}
            onClick={onViewSibling ? () => onViewSibling(sibling.id) : undefined}
            className={`p-3 transition-colors ${
              onViewSibling
                ? "hover:bg-muted/60 cursor-pointer"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  id={sibling.id}
                  name={sibling.name}
                  className="w-8 h-8 rounded-full text-xs font-bold shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">
                      {sibling.name}
                    </span>
                    {sibling.grNumber && <GrBadge grNumber={sibling.grNumber} />}
                    {sibling.status && (
                      <StatusBadge
                        status={sibling.status}
                        size="sm"
                        config={statusBadgeConfig}
                      />
                    )}
                  </div>
                  {sibling.sessionNames.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {sibling.sessionNames.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {onViewSibling && (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
