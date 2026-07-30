import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Session, Discount } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { formatMoney } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { DiscountModal } from "@/tenant/features/sessions/components/tabs/DiscountModal";

interface DiscountsTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * DiscountsTab Component
 *
 * Renders the discounts tab for a session, allowing managing individual discounts.
 *
 * @param {DiscountsTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function DiscountsTab({ session, onUpdate, canWrite }: DiscountsTabProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const discounts = session.discounts || [];

  const handleSave = async (discountToSave: Discount) => {
    const existing = discounts.find((discountItem) => discountItem.id === discountToSave.id);
    setSaving(true);
    try {
      await onUpdate({ ...session, discounts: existing ? discounts.map((discountItem) => discountItem.id === discountToSave.id ? discountToSave : discountItem) : [...discounts, discountToSave] });
      setShowModal(false); setEditDiscount(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, discounts: discounts.filter((discountItem) => discountItem.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  const toggleActive = async (id: string) => await onUpdate({
    ...session,
    discounts: discounts.map((discountItem) => discountItem.id === id ? { ...discountItem, active: !discountItem.active } : discountItem),
  });

  return (
    <section aria-label={t("sessions.discounts.ariaLabel")} className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 min-w-0 text-sm font-semibold text-foreground">{t("sessions.discounts.count", { count: discounts.length })}</p>
        {canWrite && <Button
          onClick={() => { setEditDiscount(null); setShowModal(true); }}
          className="flex h-auto w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.discounts.add")}
        </Button>}
      </header>

      {discounts.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.discounts.emptyTitle")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((discountItem, index) => (
            <motion.article
              key={discountItem.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-start sm:gap-4 ${discountItem.active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${discountItem.active ? "bg-primary/10" : "bg-muted"}`} aria-hidden="true">
                <Tag className={`w-4.5 h-4.5 ${discountItem.active ? "text-primary" : "text-muted-foreground"}`} style={{ width: 18, height: 18 }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <h4 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">{discountItem.name}</h4>
                  <StatusBadge
                    status={discountItem.active ? "active" : "inactive"}
                    config={{
                      active: { label: t("sessions.discounts.active"), cls: SEMANTIC_BADGE.success },
                      inactive: { label: t("sessions.discounts.inactive"), cls: SEMANTIC_BADGE.muted },
                    }}
                    size="sm"
                  />
                </div>
                <p className="text-sm font-semibold text-primary m-0">
                  {t("sessions.discounts.off", { amount: discountItem.type === "percentage" ? `${discountItem.value}%` : formatMoney(discountItem.value, session.currency) })}
                </p>
                {discountItem.conditions && <p className="text-xs text-muted-foreground mt-0.5 m-0">{discountItem.conditions}</p>}
              </div>
              {canWrite && <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
                <Button aria-label={discountItem.active ? t("sessions.discounts.deactivate") : t("sessions.discounts.activate")} onClick={() => { void toggleActive(discountItem.id); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={discountItem.active ? t("sessions.discounts.deactivate") : t("sessions.discounts.activate")} variant="ghost" size="icon">
                  {discountItem.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                </Button>
                <Button aria-label={t("sessions.discounts.editNamed", { name: discountItem.name })} onClick={() => { setEditDiscount(discountItem); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" variant="ghost" size="icon">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button aria-label={t("sessions.discounts.deleteNamed", { name: discountItem.name })} onClick={() => setDeleteTarget(discountItem)} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>}
            </motion.article>
          ))}
        </div>
      )}

      <DiscountModal
        open={showModal}
        discount={editDiscount}
        onClose={() => { if (!saving) { setShowModal(false); setEditDiscount(null); } }}
        onSave={handleSave}
        saving={saving}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.discounts.confirmDeleteTitle")}
        description={t("sessions.discounts.confirmDeleteDescription", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}
