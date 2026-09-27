import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Mujtahid, MujtahidRep, ObligationType } from "@/lib/data/obligationsData";
import type { InitialDistRow } from "./wakalaFormModalTypes";

interface WakalaStep3DistributionProps {
  selectedObType: ObligationType | undefined;
  selectedRep: MujtahidRep | undefined;
  selectedMujtahid: Mujtahid | undefined;
  initialDistributions: InitialDistRow[];
  totalPercentage: number;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, updates: Partial<InitialDistRow>) => void;
}

export function WakalaStep3Distribution({
  selectedObType,
  selectedRep,
  selectedMujtahid,
  initialDistributions,
  totalPercentage,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: WakalaStep3DistributionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1">
        <div className="font-semibold text-muted-foreground">Configuration Summary:</div>
        <div className="flex flex-wrap gap-2 text-foreground font-medium">
          <span>{selectedObType?.name}</span>
          <span>•</span>
          <span>{selectedRep?.name}</span>
          <span>({selectedMujtahid?.name})</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Initial Distribution Split (Optional)
          </h4>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full border",
              totalPercentage === 100
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : totalPercentage > 100
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600",
            )}
          >
            Total: {totalPercentage}%
          </span>
        </div>

        {initialDistributions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic border border-dashed rounded-lg p-3 text-center">
            No distribution splits added yet. You can save now and add distribution rules later.
          </p>
        ) : (
          <div className="space-y-2">
            {initialDistributions.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2 bg-background"
              >
                <Input
                  placeholder="Name (e.g. Saham-e-Imam)"
                  value={row.name}
                  onChange={(e) => onUpdateRow(row.id, { name: e.target.value })}
                  className="flex-1 text-xs h-9"
                />
                <div className="w-20">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="%"
                    value={row.percentage || ""}
                    onChange={(e) => onUpdateRow(row.id, { percentage: Number(e.target.value) })}
                    className="text-xs h-9"
                  />
                </div>
                <FormSelect
                  value={row.type}
                  onChange={(val) => onUpdateRow(row.id, { type: val as "Income" | "Liability" })}
                  options={[
                    { value: "Income", label: t("obligations.distribution.income") },
                    { value: "Liability", label: t("obligations.distribution.liability") },
                  ]}
                  className="w-28 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRow(row.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="w-full flex items-center justify-center gap-1.5 text-xs h-9 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" /> {t("obligations.wakala.addDistribution")}
        </Button>
      </div>
    </div>
  );
}
