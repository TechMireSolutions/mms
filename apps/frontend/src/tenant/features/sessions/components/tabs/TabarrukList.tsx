import React from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { TabarrukItem } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { formatDate } from "@mms/shared";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface TabarrukListProps {
  items: TabarrukItem[];
  canWrite: boolean;
  t: TranslationFunction;
  onEdit: (item: TabarrukItem) => void;
  onDelete: (item: TabarrukItem) => void;
}

export function TabarrukList({ items, canWrite, t, onEdit, onDelete }: TabarrukListProps): React.JSX.Element {
  const rowMotion = useListRowMotion({ fade: true, duration: 0.1 });
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="space-y-3 p-3 md:hidden">
        {items.map((tabarrukItem, index) => (
          <motion.article
            key={tabarrukItem.id}
            {...rowMotion(index * 0.04)}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground m-0">{tabarrukItem.item}</h4>
                {tabarrukItem.note && <p className="text-xs text-muted-foreground m-0 mt-0.5">{tabarrukItem.note}</p>}
              </div>
              {canWrite && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button aria-label={t("sessions.tabarruk.editNamed", { name: tabarrukItem.item })} onClick={() => onEdit(tabarrukItem)} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" variant="ghost" size="icon">
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button aria-label={t("sessions.tabarruk.deleteNamed", { name: tabarrukItem.item })} onClick={() => onDelete(tabarrukItem)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" variant="ghost" size="icon">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.tabarruk.form.quantity")}</dt>
                <dd className="text-sm text-foreground">{tabarrukItem.quantity || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.tabarruk.form.date")}</dt>
                <dd className="text-sm text-muted-foreground">{tabarrukItem.date ? formatDate(tabarrukItem.date) : "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.tabarruk.form.occasion")}</dt>
                <dd className="text-sm text-muted-foreground">{tabarrukItem.occasion || "—"}</dd>
              </div>
            </dl>
          </motion.article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("sessions.tabarruk.tableCaption")}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sessions.tabarruk.form.item")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sessions.tabarruk.form.quantity")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sessions.tabarruk.form.occasion")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sessions.tabarruk.form.date")}</th>
              <th scope="col" className="px-4 py-2.5 w-16"><span className="sr-only">{t("common.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((tabarrukItem, index) => (
              <motion.tr
                key={tabarrukItem.id}
                {...rowMotion(index * 0.04)}
                className="hover:bg-muted/20 transition-colors group"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground m-0">{tabarrukItem.item}</p>
                  {tabarrukItem.note && <p className="text-xs text-muted-foreground m-0">{tabarrukItem.note}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{tabarrukItem.quantity || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{tabarrukItem.occasion || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{tabarrukItem.date ? formatDate(tabarrukItem.date) : "—"}</span>
                </td>
                <td className="px-4 py-3">
                  {canWrite && <div className="flex items-center gap-1 justify-end">
                    <Button aria-label={t("sessions.tabarruk.editNamed", { name: tabarrukItem.item })} onClick={() => onEdit(tabarrukItem)} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button aria-label={t("sessions.tabarruk.deleteNamed", { name: tabarrukItem.item })} onClick={() => onDelete(tabarrukItem)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
