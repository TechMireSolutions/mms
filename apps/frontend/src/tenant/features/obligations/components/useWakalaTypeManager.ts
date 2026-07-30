import { useMemo, useState } from "react";
import { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import type { WakalaTypeManagerProps } from "@/tenant/features/obligations/components/wakalaTypeManagerTypes";

interface ModalState {
  mode: "add" | "edit" | "add-dist" | "edit-dist";
  distMode?: "add" | "edit";
  data: Partial<import('@/lib/data/obligationsData').WakalaType> | Partial<import('@/lib/data/obligationsData').ObligationDistribution>;
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
  const emDash = t("obligations.wakala.emDash");

  const distributionTypeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Income: { label: t("obligations.distribution.income"), cls: SEMANTIC_BADGE.success },
    Liability: { label: t("obligations.distribution.liability"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const getRep = (repId: string) => reps.find((rep) => rep.id === repId);
  const getMujtahid = (mujtahidId: string) => mujtahids.find((mujtahid) => mujtahid.id === mujtahidId);
  const getObType = (obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId);
  const getDistributions = (wakalaTypeId: string) => distributions.filter((distribution) => distribution.wakala_type_id === wakalaTypeId);
  const totalPct = (wakalaTypeId: string) =>
    getDistributions(wakalaTypeId).reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0);

  const handleSaveWakala = async (form: Partial<import('@/lib/data/obligationsData').WakalaType>) => {
    if (modal?.mode === "add") {
      await onChangeWakala([...wakalaTypes, { ...form, id: `wt${Date.now()}` } as import('@/lib/data/obligationsData').WakalaType]);
    } else if (modal?.mode === "edit") {
      await onChangeWakala(wakalaTypes.map((wakalaType) => wakalaType.id === form.id ? (form as import('@/lib/data/obligationsData').WakalaType) : wakalaType));
    }
    setModal(null);
  };

  const handleDeleteWakala = async (wakalaTypeId: string) => {
    if (!confirm(t("obligations.wakala.deleteConfirm"))) return;
    await onChangeWakala(wakalaTypes.filter((wakalaType) => wakalaType.id !== wakalaTypeId));
    await onChangeDistributions(distributions.filter((distribution) => distribution.wakala_type_id !== wakalaTypeId));
  };

  const handleSaveDist = async (form: Partial<import('@/lib/data/obligationsData').ObligationDistribution>) => {
    const existing = getDistributions(form.wakala_type_id!);
    const otherDistributions = existing.filter((distribution) => distribution.id !== form.id);
    const newTotal = otherDistributions.reduce((sum, distribution) => sum + parseFloat(String(distribution.percentage ?? 0)), 0) + parseFloat(String(form.percentage ?? 0));
    if (newTotal > 100) {
      alert(t("obligations.wakala.pctExceed", { pct: newTotal }));
      return;
    }
    if (modal?.distMode === "add") {
      await onChangeDistributions([...distributions, { ...form, id: `od${Date.now()}` } as import('@/lib/data/obligationsData').ObligationDistribution]);
    } else if (modal?.distMode === "edit") {
      await onChangeDistributions(distributions.map((distribution) => distribution.id === form.id ? (form as import('@/lib/data/obligationsData').ObligationDistribution) : distribution));
    }
    setModal(null);
  };

  const handleDeleteDist = async (distributionId: string) => {
    if (!confirm(t("obligations.wakala.distDeleteConfirm"))) return;
    await onChangeDistributions(distributions.filter((distribution) => distribution.id !== distributionId));
  };

  return {
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
  };
}
