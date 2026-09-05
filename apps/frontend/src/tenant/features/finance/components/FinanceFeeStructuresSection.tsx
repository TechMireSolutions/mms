import React, { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  useFinanceFeeStructureMutations,
  useFinanceFeeStructures,
} from "@/tenant/features/finance/hooks/useFinanceFeeStructures";

export function FinanceFeeStructuresSection(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: structures = [] } = useFinanceFeeStructures();
  const { save, remove } = useFinanceFeeStructureMutations();
  const [name, setName] = useState("");
  const [session, setSession] = useState("");
  const [className, setClassName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "term" | "once">("monthly");

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) return;
    try {
      await save.mutateAsync({
        name: name.trim(),
        session: session.trim(),
        className: className.trim(),
        isActive: true,
        frequency,
        items: itemName.trim()
          ? [{ name: itemName.trim(), amount: Number(itemAmount || 0), sortOrder: 0 }]
          : [],
      });
      setName("");
      setSession("");
      setClassName("");
      setItemName("");
      setItemAmount("");
      setFrequency("monthly");
      notify.success(t("finance.feeStructures.saved"));
    } catch (error) {
      notify.error(t("finance.feeStructures.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <SectionCard
      title={t("finance.feeStructures.title")}
      icon={Layers}
      className={SETUP_SECTION_CARD_CLASS}
    >
      <p className="m-0 mb-3 text-xs text-muted-foreground">{t("finance.feeStructures.hint")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("finance.feeStructures.name")}>
          <Input className={FORM_INPUT} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label={t("finance.feeStructures.session")}>
          <Input className={FORM_INPUT} value={session} onChange={(event) => setSession(event.target.value)} />
        </Field>
        <Field label={t("finance.feeStructures.class")}>
          <Input className={FORM_INPUT} value={className} onChange={(event) => setClassName(event.target.value)} />
        </Field>
        <Field label={t("finance.feeStructures.frequency")}>
          <FormSelect
            value={frequency}
            onChange={(value) => setFrequency(value as "monthly" | "term" | "once")}
            options={[
              { value: "monthly", label: t("finance.feeStructures.frequencyMonthly") },
              { value: "term", label: t("finance.feeStructures.frequencyTerm") },
              { value: "once", label: t("finance.feeStructures.frequencyOnce") },
            ]}
          />
        </Field>
        <Field label={t("finance.feeStructures.item")}>
          <div className="flex gap-2">
            <Input className={FORM_INPUT} value={itemName} onChange={(event) => setItemName(event.target.value)} />
            <Input
              className={`${FORM_INPUT} w-28`}
              inputMode="decimal"
              value={itemAmount}
              onChange={(event) => setItemAmount(event.target.value)}
              aria-label={t("finance.feeStructures.amount")}
            />
          </div>
        </Field>
      </div>
      <Button type="button" className="mt-3 min-h-11" onClick={() => void handleAdd()} disabled={!name.trim() || save.isPending}>
        <Plus className="me-1 h-4 w-4" aria-hidden="true" />
        {t("finance.feeStructures.add")}
      </Button>
      <ul className="m-0 mt-4 list-none space-y-2 p-0">
        {structures.map((structure) => (
          <li key={structure.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold">{structure.name}</p>
              <p className="m-0 text-xs text-muted-foreground">
                {`${[structure.className, structure.session].filter(Boolean).join(" · ") || t("finance.feeStructures.noScope")} · ${
                  structure.frequency === "once"
                    ? t("finance.feeStructures.frequencyOnce")
                    : structure.frequency === "term"
                      ? t("finance.feeStructures.frequencyTerm")
                      : t("finance.feeStructures.frequencyMonthly")
                }`}
                {structure.items.length > 0 ? ` · ${structure.items.length} ${t("finance.feeStructures.items")}` : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-11 text-destructive"
              aria-label={`${t("common.delete")} ${structure.name}`}
              onClick={() => void remove.mutateAsync(structure.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
        {structures.length === 0 && (
          <li className="py-4 text-center text-xs text-muted-foreground">{t("finance.feeStructures.empty")}</li>
        )}
      </ul>
    </SectionCard>
  );
}
