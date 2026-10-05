import type React from "react";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

export function FacultyFormDesignationRoles({
  assignableRoles,
  hasDesignation,
}: {
  assignableRoles: string[];
  hasDesignation: boolean;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!hasDesignation && assignableRoles.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Shield className="size-3.5 text-primary" aria-hidden />
        <span>{t("faculty.designations.roles")}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {assignableRoles.map((role) => (
          <Badge key={role} variant="secondary" className="text-xs font-normal">{role}</Badge>
        ))}
        {!assignableRoles.length && (
          <span className="text-xs text-muted-foreground">{t("faculty.designations.noAssignableRoles")}</span>
        )}
      </div>
    </div>
  );
}
