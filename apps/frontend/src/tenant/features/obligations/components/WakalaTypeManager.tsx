import React from "react";
import { Plus } from "lucide-react";
import { DistributionFormModal } from "@/tenant/features/obligations/components/DistributionFormModal";
import { WakalaFormModal } from "@/tenant/features/obligations/components/WakalaFormModal";
import { Button } from "@/components/ui/button";
import { WakalaTypeCard } from "@/tenant/features/obligations/components/WakalaTypeCard";
import { useWakalaTypeManager } from "@/tenant/features/obligations/components/useWakalaTypeManager";
import type { WakalaTypeManagerProps } from "@/tenant/features/obligations/components/wakalaTypeManagerTypes";

export type { DistributionType, WakalaTypeManagerProps } from "@/tenant/features/obligations/components/wakalaTypeManagerTypes";

export function WakalaTypeManager(props: WakalaTypeManagerProps) {
  const {
    wakalaTypes,
    obligationTypes,
    reps,
    mujtahids,
  } = props;
  const {
    t,
    modal,
    setModal,
    emDash,
    distributionTypeConfig,
    getRep,
    getMujtahid,
    getObType,
    getDistributions,
    totalPct,
    handleSaveWakala,
    handleDeleteWakala,
    handleSaveDist,
    handleDeleteDist,
  } = useWakalaTypeManager(props);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-sm text-muted-foreground">{t("obligations.wakala.count", { count: wakalaTypes.length })}</p>
        <Button type="button" onClick={() => setModal({ mode: "add", data: { mujtahid_representative_id: reps[0]?.id || "", obligation_type_id: obligationTypes[0]?.id || "" } })}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.wakala.add")}
        </Button>
      </header>

      <section aria-label={t("obligations.wakala.listAria")} className="space-y-3">
        {wakalaTypes.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-xl border border-border">{t("obligations.wakala.empty")}</div>
        )}
        {wakalaTypes.map((wakalaType) => {
          const rep = getRep(wakalaType.mujtahid_representative_id);
          const mujtahid = rep ? getMujtahid(rep.mujtahid_id) : null;
          const obligationType = getObType(wakalaType.obligation_type_id);
          const wakalaDistributions = getDistributions(wakalaType.id);
          const total = totalPct(wakalaType.id);
          const isComplete = Math.abs(total - 100) < 0.01;
          const typeName = obligationType?.name || emDash;

          return (
            <WakalaTypeCard
              key={wakalaType.id}
              wakalaType={wakalaType}
              typeName={typeName}
              repName={rep?.name || emDash}
              mujtahidName={mujtahid?.name || emDash}
              wakalaDistributions={wakalaDistributions}
              total={total}
              isComplete={isComplete}
              distributionTypeConfig={distributionTypeConfig}
              t={t}
              onEdit={() => setModal({ mode: "edit", data: { ...wakalaType } })}
              onDelete={() => { void handleDeleteWakala(wakalaType.id); }}
              onEditDistribution={(distribution) => setModal({ mode: "edit-dist", distMode: "edit", data: { ...distribution } })}
              onDeleteDistribution={(distributionId) => { void handleDeleteDist(distributionId); }}
              onAddDistribution={() => setModal({ mode: "add-dist", distMode: "add", data: { name: "", percentage: 0, wakala_type_id: wakalaType.id, type: "Liability" } })}
            />
          );
        })}
      </section>

      {modal && (modal.mode === "add" || modal.mode === "edit") ? (
        <WakalaFormModal
          title={modal.mode === "add" ? t("obligations.wakala.addTitle") : t("obligations.wakala.editTitle")}
          initial={modal.data}
          reps={reps}
          mujtahids={mujtahids}
          obligationTypes={obligationTypes}
          onSave={handleSaveWakala}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal && (modal.mode === "add-dist" || modal.mode === "edit-dist") ? (
        <DistributionFormModal
          title={modal.distMode === "add" ? t("obligations.wakala.distAddTitle") : t("obligations.wakala.distEditTitle")}
          initial={modal.data}
          onSave={handleSaveDist}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}
