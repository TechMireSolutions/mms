import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Package, X, Save } from "lucide-react";
import { Denomination, StockBatch } from '@/lib/data/hasanatData';
import { DatePicker } from "../ui/DatePicker";

const INPUT = "w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

interface AddBatchModalProps {
  denoms: Denomination[];
  onClose: () => void;
  onSave: (batch: StockBatch) => void;
}

function AddBatchModal({ denoms, onClose, onSave }: AddBatchModalProps) {
  const [data, setData] = useState<Partial<StockBatch>>({ 
    denominationId: denoms[0]?.id || "", 
    quantity: 0, 
    addedDate: new Date().toISOString().split("T")[0], 
    addedBy: "", 
    note: "" 
  });
  
  const upd = <K extends keyof StockBatch>(f: K, v: StockBatch[K]) => setData((d: Partial<StockBatch>) => ({ ...d, [f]: v }));
  const selectedDen = denoms.find((d) => d.id === data.denominationId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-batch-modal-title"
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 id="add-batch-modal-title" className="text-sm font-bold text-foreground m-0">Add Stock Batch</h3>
          <button type="button" aria-label="Close modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></button>
        </header>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="denom" className={LABEL}>Denomination *</label>
            <select id="denom" className={INPUT + " cursor-pointer"} value={data.denominationId} onChange={(e) => upd("denominationId", e.target.value)}>
              {denoms.filter((d) => d.active).map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.name} ({d.points} pts)</option>
              ))}
            </select>
          </div>
          {selectedDen && (
            <div className="h-10 rounded-xl flex items-center gap-2 px-3 text-white text-sm font-semibold" style={{ background: selectedDen.color }}>
              <span aria-hidden="true">{selectedDen.icon}</span><span>{selectedDen.name}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qty" className={LABEL}>Quantity *</label>
              <input id="qty" type="number" className={INPUT} value={data.quantity || ""} onChange={(e) => upd("quantity", Number(e.target.value))} placeholder="0" min={1} />
            </div>
            <div>
              <label htmlFor="add-date" className={LABEL}>Date</label>
              <DatePicker
                id="add-date"
                value={data.addedDate || ""}
                onChange={(val) => upd("addedDate", val)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="added-by" className={LABEL}>Added By</label>
            <input id="added-by" className={INPUT} value={data.addedBy} onChange={(e) => upd("addedBy", e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="note" className={LABEL}>Note</label>
            <input id="note" className={INPUT} value={data.note} onChange={(e) => upd("note", e.target.value)} placeholder="e.g. January batch" />
          </div>
        </div>
        <footer className="px-5 py-4 border-t border-border flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const den = denoms.find((d) => d.id === data.denominationId);
              onSave({ ...data, id: `bat${Date.now()}`, quantity: Number(data.quantity), remaining: Number(data.quantity), denominationName: den?.name || "" } as StockBatch);
            }}
            disabled={!data.denominationId || !data.quantity}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> Add Batch
          </button>
        </footer>
      </motion.div>
    </div>
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
export default function StockManager({ batches, denoms, onUpdate }: StockManagerProps) {
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (batch: StockBatch) => { onUpdate([...batches, batch]); setShowModal(false); };

  // Group by denomination
  const grouped = denoms.reduce((acc: Record<string, { den: Denomination, batches: StockBatch[] }>, den: Denomination) => {
    const denBatches = batches.filter((b: StockBatch) => b.denominationId === den.id);
    if (denBatches.length > 0) acc[den.id] = { den, batches: denBatches };
    return acc;
  }, {} as Record<string, { den: Denomination, batches: StockBatch[] }>);

  return (
    <section aria-label="Stock Manager" className="space-y-5">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Batch
        </button>
      </header>

      {(Object.values(grouped) as { den: Denomination; batches: StockBatch[] }[]).map(({ den, batches: dBatches }) => {
        const totalStock = dBatches.reduce((s: number, b: StockBatch) => s + b.quantity, 0);
        const totalRemaining = dBatches.reduce((s: number, b: StockBatch) => s + b.remaining, 0);
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
              {dBatches.map((b: StockBatch, i: number) => {
                const bPct = b.quantity > 0 ? Math.round((b.remaining / b.quantity) * 100) : 0;
                return (
                  <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 px-4 py-3">
                    <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground m-0">{b.note || "Batch"}</p>
                      <p className="text-[10px] text-muted-foreground m-0">{b.addedDate} · Added by {b.addedBy || "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[12px] font-bold text-foreground m-0">{b.remaining}<span className="text-muted-foreground font-normal">/{b.quantity}</span></p>
                      <p className="text-[10px] text-muted-foreground m-0">{bPct}% left</p>
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

      <AnimatePresence>
        {showModal && <AddBatchModal denoms={denoms} onClose={() => setShowModal(false)} onSave={handleAdd} />}
      </AnimatePresence>
    </section>
  );
}
