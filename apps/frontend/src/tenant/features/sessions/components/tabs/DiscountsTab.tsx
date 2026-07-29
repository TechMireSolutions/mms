import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Session, Discount } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { formatMoney } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const EMPTY: Partial<Discount> = { name: "", type: "percentage", value: 0, conditions: "", active: true };

interface DiscountModalProps {
  open: boolean;
  discount: Discount | null;
  onClose: () => void;
  onSave: (discount: Discount) => void | Promise<void>;
  saving: boolean;
}

function DiscountModal({ open, discount, onClose, onSave, saving }: DiscountModalProps) {
  const { t } = useTranslation();
  const [discountDraft, setDiscountDraft] = useState<Partial<Discount>>(discount ? { ...discount } : { ...EMPTY });
  const updateDiscountDraft = <K extends keyof Discount>(field: K, value: Discount[K]) => setDiscountDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setDiscountDraft(discount ? { ...discount } : { ...EMPTY });
    }
  }, [open, discount]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={discount ? t("sessions.discounts.edit") : t("sessions.discounts.add")}
      icon={Tag}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => onSave({ ...discountDraft, id: discount?.id || `d${Date.now()}` } as Discount)}
      saveDisabled={!discountDraft.name}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="discount-name">{t("sessions.discounts.form.name")} *</label>
          <Input id="discount-name" value={discountDraft.name || ""} onChange={(event) => updateDiscountDraft("name", event.target.value)} placeholder={t("sessions.discounts.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="discount-type">{t("sessions.discounts.form.type")}</label>
            <FormSelect
              id="discount-type"
              value={discountDraft.type || "percentage"}
              onChange={(value) => updateDiscountDraft("type", value as Discount["type"])}
              options={[
                { value: "percentage", label: t("sessions.discounts.type.percentage") },
                { value: "fixed", label: t("sessions.discounts.type.fixed") },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="discount-value">{t("sessions.discounts.form.value")}</label>
            <Input id="discount-value" type="number" value={discountDraft.value || 0} onChange={(event) => updateDiscountDraft("value", +event.target.value)} min={0} max={discountDraft.type === "percentage" ? 100 : undefined} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="discount-conditions">{t("sessions.discounts.form.conditions")}</label>
          <Textarea id="discount-conditions" className="min-h-[4rem] resize-none" value={discountDraft.conditions || ""} onChange={(event) => updateDiscountDraft("conditions", event.target.value)} placeholder={t("sessions.discounts.form.conditionsPlaceholder")} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={discountDraft.active || false} onCheckedChange={(checked) => updateDiscountDraft("active", !!checked)} />
          <span className="text-sm text-foreground font-medium">{t("sessions.discounts.active")}</span>
        </label>
      </div>
    </FormModal>
  );
}

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
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{t("sessions.discounts.count", { count: discounts.length })}</p>
        {canWrite && <Button
          onClick={() => { setEditDiscount(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
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
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${discountItem.active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${discountItem.active ? "bg-primary/10" : "bg-muted"}`} aria-hidden="true">
                <Tag className={`w-4.5 h-4.5 ${discountItem.active ? "text-primary" : "text-muted-foreground"}`} style={{ width: 18, height: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-foreground m-0">{discountItem.name}</h4>
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
              {canWrite && <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button aria-label={discountItem.active ? t("sessions.discounts.deactivate") : t("sessions.discounts.activate")} onClick={() => { void toggleActive(discountItem.id); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={discountItem.active ? t("sessions.discounts.deactivate") : t("sessions.discounts.activate")} variant="ghost" size="icon">
                  {discountItem.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                </Button>
                <Button aria-label={t("sessions.discounts.editNamed", { name: discountItem.name })} onClick={() => { setEditDiscount(discountItem); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" variant="ghost" size="icon">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button aria-label={t("sessions.discounts.deleteNamed", { name: discountItem.name })} onClick={() => setDeleteTarget(discountItem)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" variant="ghost" size="icon">
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
