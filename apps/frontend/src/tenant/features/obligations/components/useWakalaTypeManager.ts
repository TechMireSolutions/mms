import { useMemo, useState, useCallback } from "react";
import { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type {
  WakalaType,
  ObligationDistribution,
} from "@/lib/data/obligationsData";
import type { WakalaTypeManagerProps } from "@/tenant/features/obligations/components/wakalaTypeManagerTypes";

interface ModalState {
  mode: "add" | "edit" | "add-dist" | "edit-dist";
  distMode?: "add" | "edit";
  data: Partial<WakalaType> | Partial<ObligationDistribution>;
}

export function useWakalaTypeManager({
  wakalaTypes,
  distributions,
  obligationTypes,
  reps,
  mujtahids,
  onChangeWakala,
  onChangeDistributions,
}: WakalaTypeManagerProps) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteWakalaTargetId, setDeleteWakalaTargetId] = useState<string | null>(null);
  const [deleteDistTargetId, setDeleteDistTargetId] = useState<string | null>(null);
  const emDash = t("obligations.wakala.emDash");

  const distributionTypeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Income: { label: t("obligations.distribution.income"), cls: SEMANTIC_BADGE.success },
    Liability: { label: t("obligations.distribution.liability"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const getRep = useCallback((repId: string) => reps.find((rep) => rep.id === repId), [reps]);
  const getMujtahid = useCallback((mujtahidId: string) => mujtahids.find((mujtahid) => mujtahid.id === mujtahidId), [mujtahids]);
  const getObType = useCallback((obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId), [obligationTypes]);
  const getDistributions = useCallback((wakalaTypeId: string) => distributions.filter((distribution) => distribution.wakala_type_id === wakalaTypeId), [distributions]);
  const totalPct = useCallback((wakalaTypeId: string) =>
    getDistributions(wakalaTypeId).reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0), [getDistributions]);

  const handleSaveWakala = async (form: Partial<WakalaType>) => {
    if (modal?.mode === "add") {
      await onChangeWakala([...wakalaTypes, { ...form, id: `wt${crypto.randomUUID()}` } as WakalaType]);
    } else if (modal?.mode === "edit") {
      await onChangeWakala(wakalaTypes.map((wakalaType) => wakalaType.id === form.id ? (form as WakalaType) : wakalaType));
    }
    setModal(null);
  };

  const handleConfirmDeleteWakala = async () => {
    if (!deleteWakalaTargetId) return;
    const targetId = deleteWakalaTargetId;
    await onChangeWakala(wakalaTypes.filter((wakalaType) => wakalaType.id !== targetId));
    await onChangeDistributions(distributions.filter((distribution) => distribution.wakala_type_id !== targetId));
    setDeleteWakalaTargetId(null);
  };

  const handleSaveDist = async (form: Partial<ObligationDistribution>) => {
    const existing = getDistributions(form.wakala_type_id!);
    const otherDistributions = existing.filter((distribution) => distribution.id !== form.id);
    const newTotal = otherDistributions.reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0) + parseFloat(String(form.percentage ?? 0));
    if (newTotal > 100) {
      notify.error(t("obligations.wakala.pctExceed", { pct: newTotal }));
      return;
    }
    if (modal?.distMode === "add") {
      await onChangeDistributions([...distributions, { ...form, id: `od${crypto.randomUUID()}` } as ObligationDistribution]);
    } else if (modal?.distMode === "edit") {
      await onChangeDistributions(distributions.map((distribution) => distribution.id === form.id ? (form as ObligationDistribution) : distribution));
    }
    setModal(null);
  };

  const handleConfirmDeleteDist = async () => {
    if (!deleteDistTargetId) return;
    const targetId = deleteDistTargetId;
    await onChangeDistributions(distributions.filter((distribution) => distribution.id !== targetId));
    setDeleteDistTargetId(null);
  };

  return {
    t,
    modal,
    setModal,
    deleteWakalaTargetId,
    setDeleteWakalaTargetId,
    deleteDistTargetId,
    setDeleteDistTargetId,
    emDash,
    distributionTypeConfig,
    getRep,
    getMujtahid,
    getObType,
    getDistributions,
    totalPct,
    handleSaveWakala,
    handleConfirmDeleteWakala,
    handleSaveDist,
    handleConfirmDeleteDist,
  };
}
