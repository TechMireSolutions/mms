import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COLLECTION_CONTAINER_CLASS, ICON_MAP } from "./contactDetailStyles";

export interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps): JSX.Element {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{title}</h4>
      <Card className={COLLECTION_CONTAINER_CLASS}>{children}</Card>
    </div>
  );
}

export interface FieldGroupCardProps {
  group: string;
  fields: { key: string; label: string; type: string }[];
  formatValue: (field: { key: string; type: string }) => string | null;
}

export function FieldGroupCard({ group, fields, formatValue }: FieldGroupCardProps): JSX.Element | null {
  const validFields = fields.map((f) => ({ field: f, val: formatValue(f) })).filter((item) => Boolean(item.val));
  if (validFields.length === 0) return null;

  return (
    <DetailSection title={group}>
      {validFields.map(({ field, val }) => {
        const Icon = ICON_MAP[field.key] || Tag;
        return (
          <div key={field.key} className="flex items-center gap-3 p-3 group/row">
            <div className="p-2 rounded-lg bg-muted/80 group-hover/row:bg-primary/10 transition-colors">
              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">
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
