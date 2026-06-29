import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Package } from "lucide-react";
import { Denomination, StockBatch } from '@/lib/data/hasanatData';
import { DatePicker } from "../ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

interface AddBatchModalProps {
  open: boolean;
  denoms: Denomination[];
  onClose: () => void;
  onSave: (batch: StockBatch) => void;
}

function AddBatchModal({ open, denoms, onClose, onSave }: AddBatchModalProps) {
  const [data, setData] = useState<Partial<StockBatch>>({
    denominationId: denoms[0]?.id || "",
    quantity: 0,
    addedDate: new Date().toISOString().split("T")[0],
    addedByUserId: "",
    note: "",
  });

  const updateField = <K extends keyof StockBatch>(field: K, value: StockBatch[K]) => setData((previousData: Partial<StockBatch>) => ({ ...previousData, [field]: value }));
  const selectedDenomination = denoms.find((denomination) => denomination.id === data.denominationId);

  React.useEffect(() => {
    if (open) {
      setData({
        denominationId: denoms[0]?.id || "",
        quantity: 0,
        addedDate: new Date().toISOString().split("T")[0],
        addedBy: "",
        note: "",
      });
    }
  }, [open, denoms]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Add Stock Batch"
      icon={Package}
      cancelLabel="Cancel"
      saveLabel="Add Batch"
      onSave={() => {
        const denomination = denoms.find((candidate) => candidate.id === data.denominationId);
        onSave({ ...data, id: `bat${Date.now()}`, quantity: Number(data.quantity), remaining: Number(data.quantity), denominationName: denomination?.name || "" } as StockBatch);
      }}
      saveDisabled={!data.denominationId || !data.quantity}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="denom" className={FORM_LABEL}>Denomination *</label>
          <FormSelect
            id="denom"
            value={data.denominationId || ""}
            onChange={(value) => updateField("denominationId", value)}
            options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
              value: denomination.id,
              label: `${denomination.icon} ${denomination.name} (${denomination.points} pts)`
            }))}
          />
        </div>
        {selectedDenomination && (
          <div className="h-10 rounded-xl flex items-center gap-2 px-3 text-white text-sm font-semibold" style={{ background: selectedDenomination.color }}>
            <span aria-hidden="true">{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qty" className={FORM_LABEL}>Quantity *</label>
            <Input id="qty" type="number" className={FORM_INPUT} value={data.quantity || ""} onChange={(event) => updateField("quantity", Number(event.target.value))} placeholder="0" min={1} />
          </div>
          <div>
            <label htmlFor="add-date" className={FORM_LABEL}>Date</label>
            <DatePicker
              id="add-date"
              value={data.addedDate || ""}
              onChange={(value) => updateField("addedDate", value)}
            />
          </div>
        </div>
        <UserActorSelect
          id="added-by"
          label="Added By"
          value={data.addedByUserId || ""}
          onChange={(id) => updateField("addedByUserId", id)}
          allowEmpty
        />
        <div>
          <label htmlFor="note" className={FORM_LABEL}>Note</label>
          <Input id="note" className={FORM_INPUT} value={data.note} onChange={(event) => updateField("note", event.target.value)} placeholder="e.g. January batch" />
        </div>
      </div>
    </FormModal>
  );
}

export interface StockManagerProps {
  batches: StockBatch[];
  denoms: Denomination[];
  onUpdate: (batches: StockBatch[]) => void;
}

/**
 * StockManager Component
 *
 * Renders the inventory stock management interface for Hasanat reward physical cards.
 * Provides controls for viewing current card batches, adding new batches of cards,
 * and monitoring inventory depletion ratios across denominations.
 *
 * @param props - Component properties.
 * @returns React element representing the stock manager UI.
 */
export function StockManager({ batches, denoms, onUpdate }: StockManagerProps) {
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (batch: StockBatch) => { onUpdate([...batches, batch]); setShowModal(false); };

  // Group by denomination
  const grouped = denoms.reduce((groups: Record<string, { den: Denomination, batches: StockBatch[] }>, denomination: Denomination) => {
    const denominationBatches = batches.filter((batch: StockBatch) => batch.denominationId === denomination.id);
    if (denominationBatches.length > 0) groups[denomination.id] = { den: denomination, batches: denominationBatches };
    return groups;
  }, {} as Record<string, { den: Denomination, batches: StockBatch[] }>);

  return (
    <section aria-label="Stock Manager" className="space-y-5">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Batch
        </Button>
      </header>

      {(Object.values(grouped) as { den: Denomination; batches: StockBatch[] }[]).map(({ den, batches: denominationBatches }) => {
        const totalStock = denominationBatches.reduce((sum: number, batch: StockBatch) => sum + batch.quantity, 0);
        const totalRemaining = denominationBatches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);
        const pct = totalStock > 0 ? Math.round((totalRemaining / totalStock) * 100) : 0;

        return (
          <article key={den.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Den header */}
            <header className="px-4 py-3 flex items-center gap-3 border-b border-border" style={{ background: `${den.color}15` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: den.color }} aria-hidden="true">
                {den.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] font-bold text-foreground m-0">{den.name}</h3>
                <p className="text-[11px] text-muted-foreground m-0">{den.points} points · {totalRemaining}/{totalStock} available</p>
              </div>
              <div className="w-20">
                <div className="h-1.5 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${den.name} availability`}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: den.color }} />
                </div>
                <p className="text-[10px] text-right text-muted-foreground mt-0.5 m-0">{pct}%</p>
              </div>
            </header>

            {/* Batches */}
            <div className="divide-y divide-border/50">
              {denominationBatches.map((batch: StockBatch, index: number) => {
                const batchPercentage = batch.quantity > 0 ? Math.round((batch.remaining / batch.quantity) * 100) : 0;
                return (
                  <motion.div key={batch.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-3 px-4 py-3">
                    <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground m-0">{batch.note || "Batch"}</p>
                      <p className="text-[10px] text-muted-foreground m-0">{batch.addedDate} · Added by {batch.addedBy || "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[12px] font-bold text-foreground m-0">{batch.remaining}<span className="text-muted-foreground font-normal">/{batch.quantity}</span></p>
                      <p className="text-[10px] text-muted-foreground m-0">{batchPercentage}% left</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </article>
        );
      })}

      {batches.length === 0 && (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No stock batches yet</p>
        </div>
      )}

      <AddBatchModal open={showModal} denoms={denoms} onClose={() => setShowModal(false)} onSave={handleAdd} />
    </section>
  );
}
