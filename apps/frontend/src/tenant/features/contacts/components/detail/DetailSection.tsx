import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import { COLLECTION_CONTAINER_CLASS, ICON_MAP } from "./contactDetailStyles";

export interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps): JSX.Element {
  return (
    <div className="space-y-2">
      <h4 className={`${DETAIL_SECTION_TITLE} ps-1`}>{title}</h4>
      <Card className={COLLECTION_CONTAINER_CLASS}>{children}</Card>
    </div>
  );
}

export interface FieldGroupCardProps {
  group: string;
  fields: { key: string; label: string; type: string }[];
  formatValue: (field: { key: string; type: string }) => string | null;
  /** Raw field values (needed for gender icon SSOT). */
  getRawValue?: (fieldKey: string) => unknown;
}

export function FieldGroupCard({ group, fields, formatValue, getRawValue }: FieldGroupCardProps): JSX.Element | null {
  const validFields = fields.map((f) => ({ field: f, val: formatValue(f) })).filter((item) => Boolean(item.val));
  if (validFields.length === 0) return null;

  return (
    <DetailSection title={group}>
      {validFields.map(({ field, val }) => {
        const isGender = field.key === "gender";
        const rawGender = isGender ? String(getRawValue?.(field.key) ?? val ?? "") : "";
        const Icon = isGender ? getGenderIcon(rawGender) : ICON_MAP[field.key] || Tag;
        const iconClass = isGender
          ? getGenderIconClass(rawGender)
          : "text-muted-foreground group-hover/row:text-primary";
        return (
          <div key={field.key} className="flex items-center gap-3 p-3 group/row">
            <div className="p-2 rounded-lg bg-muted/80 group-hover/row:bg-primary/10 transition-colors">
              <Icon className={`w-3.5 h-3.5 transition-colors ${iconClass}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">
                {field.label}
              </span>
              <span className="text-sm font-semibold text-foreground truncate block">{val}</span>
            </div>
          </div>
        );
      })}
    </DetailSection>
  );
}
