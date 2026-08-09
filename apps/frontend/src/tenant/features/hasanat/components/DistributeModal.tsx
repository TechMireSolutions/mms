import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import { FormModal } from "@/components/ui/FormModal";
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Denomination, Distribution, StockBatch } from "@/lib/data/hasanatData";
import { todayISO } from "@mms/shared";
import { DistributeModalFields } from "@/tenant/features/hasanat/components/DistributeModalFields";

const EMPTY_DIST: Partial<Distribution> = {
  denominationId: "",
  recipientType: "student",
  recipientStudentId: "",
  recipientTeacherId: "",
  recipientClass: "",
  quantity: 1,
  reason: "",
  issuedDate: todayISO(),
  issuedByUserId: "",
};

export interface DistributeModalProps {
  open: boolean;
  denoms: Denomination[];
  batches: StockBatch[];
  onClose: () => void;
  onSave: (dist: Distribution) => void | Promise<void>;
}

export function DistributeModal({ open, denoms, batches, onClose, onSave }: DistributeModalProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<Partial<Distribution>>({
    ...EMPTY_DIST,
    denominationId: denoms[0]?.id || "",
  });

  const updateField = (field: string, value: unknown) =>
    setData((previousData: Partial<Distribution>) => ({ ...previousData, [field]: value } as Partial<Distribution>));

  useEffect(() => {
    if (open) {
      setData({
        ...EMPTY_DIST,
        denominationId: denoms[0]?.id || "",
        issuedDate: todayISO(),
        issuedByUserId: authUser?.id || "",
      });
    }
  }, [open, denoms, authUser?.id]);

  const selectedDenomination = denoms.find((denomination) => denomination.id === data.denominationId);
  const availableBatches = batches.filter((batch) => batch.denominationId === data.denominationId && batch.remaining > 0);
  const totalAvailable = availableBatches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);

  const { orderedFields, isFieldEnabled, isFieldRequired } = useHasanatConfig();

  const isValid = useMemo(() => {
    if (totalAvailable === 0) return false;
    for (const field of orderedFields) {
      const isEnabled = isFieldEnabled(field.id);
      const isRequired = isFieldRequired(field.id);
      if (!isEnabled || !isRequired) continue;
      if (field.id === "recipientName") {
        const recipientId = data.recipientType === "faculty"
          ? data.recipientTeacherId
          : data.recipientStudentId;
        if (!recipientId) return false;
        continue;
      }
      if (field.id === "issuedBy") {
        const actorId = data.issuedByUserId || "";
        if (!actorId) return false;
        continue;
      }
      const fieldValue = (data as Record<string, unknown>)[field.id];
      if (fieldValue === undefined || fieldValue === null || fieldValue === "") return false;
    }
    return true;
  }, [orderedFields, data, totalAvailable, isFieldEnabled, isFieldRequired]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("hasanat.distributeCards")}
      icon={Star}
      cancelLabel={t("common.cancel")}
      saveLabel={t("hasanat.form.distributeAction")}
      saving={submitting}
      onSave={() => {
        void (async () => {
        const denomination = denoms.find((candidate) => candidate.id === data.denominationId);
        const batch = batches.find((candidate) => candidate.denominationId === data.denominationId && candidate.remaining > 0);
        const payload: Distribution = {
          ...data,
          id: `dist${crypto.randomUUID()}`,
          denominationName: denomination?.name || "",
          batchId: batch?.id || "",
          status: "active",
          recipientName: "",
          issuedByUserId: data.issuedByUserId || authUser?.id || "",
        } as Distribution;
        if (data.recipientType === "faculty") {
          delete payload.recipientStudentId;
        } else {
          delete payload.recipientTeacherId;
        }
        setSubmitting(true);
        try {
          await onSave(payload);
        } finally {
          setSubmitting(false);
        }
        })();
      }}
      saveDisabled={!isValid}
    >
      <DistributeModalFields
        denoms={denoms}
        data={data}
        selectedDenomination={selectedDenomination}
        totalAvailable={totalAvailable}
        setData={setData}
        updateField={updateField}
      />
    </FormModal>
  );
}
