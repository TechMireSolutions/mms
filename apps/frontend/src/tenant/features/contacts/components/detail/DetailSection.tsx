import type React from "react";
import type { ReactNode } from "react";
import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import { COLLECTION_CONTAINER_CLASS, ICON_MAP } from "./contactDetailStyles";

export interface DetailSectionProps {
  title: string;
  children: ReactNode;
  accentColor?: "info" | "success" | "warning" | "destructive" | "primary" | "secondary" | "purple" | "amber" | "rose" | "teal" | "indigo" | "pink";
}

export function DetailSection({ title, children, accentColor }: DetailSectionProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <DetailSectionTitle>{title}</DetailSectionTitle>
      <Card accentColor={accentColor} className={COLLECTION_CONTAINER_CLASS}>{children}</Card>
    </div>
  );
}

export interface FieldGroupCardProps {
  group: string;
  fields: { key: string; label: string; type: string }[];
  formatValue: (field: { key: string; type: string }) => string | null;
  /** Raw field values (needed for gender icon SSOT). */
  getRawValue?: (fieldKey: string) => unknown;
  accentColor?: "info" | "success" | "warning" | "destructive" | "primary" | "secondary" | "purple" | "amber" | "rose" | "teal" | "indigo" | "pink";
}

export function FieldGroupCard({ group, fields, formatValue, getRawValue, accentColor }: FieldGroupCardProps): React.JSX.Element | null {
  const validFields = fields.map((f) => ({ field: f, val: formatValue(f) })).filter((item) => Boolean(item.val));
  if (validFields.length === 0) return null;

  return (
    <DetailSection title={group} accentColor={accentColor}>
      {validFields.map(({ field, val }) => {
        const isGender = field.key === "gender";
        const rawGender = isGender ? String(getRawValue?.(field.key) ?? val ?? "") : "";
        const Icon = isGender ? getGenderIcon(rawGender) : ICON_MAP[field.key] || Tag;
        const iconClassName = isGender ? getGenderIconClass(rawGender) : undefined;
        return (
          <DetailAttributeRow
            key={field.key}
            variant="inset"
            icon={Icon}
            label={field.label}
            value={val}
            iconClassName={iconClassName}
          />
        );
      })}
    </DetailSection>
  );
}
