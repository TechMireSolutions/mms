import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import type { Mujtahid, MujtahidRep, ObligationType } from "@/lib/data/obligationsData";

interface WakalaStep2RepresentativeProps {
  selectedMujtahid: Mujtahid | undefined;
  selectedObType: ObligationType | undefined;
  selectedRepId: string;
  availableReps: MujtahidRep[];
  errors: Record<string, string>;
  onSelectRep: (id: string) => void;
  canAddRep: boolean;
  onOpenAddRep: () => void;
}

export function WakalaStep2Representative({
  selectedMujtahid,
  selectedObType,
  selectedRepId,
  availableReps,
  errors,
  onSelectRep,
  canAddRep,
  onOpenAddRep,
}: WakalaStep2RepresentativeProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
        <div className="font-semibold text-primary">Stage 1 Selection:</div>
        <div className="mt-1 flex flex-wrap gap-2 text-foreground">
          <span className="rounded bg-background px-2 py-0.5 border font-medium">
            Mujtahid: {selectedMujtahid?.name || "?"}
          </span>
          <span className="rounded bg-background px-2 py-0.5 border font-medium">
            Type: {selectedObType?.name || "?"}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="wakala-rep" className={FORM_LABEL}>
          {t("obligations.wakala.repLabel")}
          <RequiredMark />
        </label>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormSelect
              id="wakala-rep"
              name="mujtahid_representative_id"
              value={selectedRepId}
              onChange={onSelectRep}
              placeholder={t("obligations.wakala.repPlaceholder")}
              options={availableReps.map((rep) => ({
                value: rep.id,
                label: rep.name,
              }))}
            />
          </div>
          {canAddRep && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mb-[0px] h-10 w-10 shrink-0"
              onClick={onOpenAddRep}
              aria-label={t("obligations.mujtahids.addRep")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {availableReps.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            No representative for this Mujtahid yet. Click `+` to add one.
          </p>
        )}
        {errors.rep && (
          <p className="mt-1 text-sm font-medium text-destructive">{errors.rep}</p>
        )}
      </div>
    </div>
  );
}
