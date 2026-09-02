import React from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { type TabarrukItem } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { formatDate } from "@mms/shared";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
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
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {items.map((tabarrukItem, index) => (
          <motion.article
            key={tabarrukItem.id}
            {...rowMotion(index * 0.04)}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
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
            <StatGrid>
              <StatRow
                label={t("sessions.tabarruk.form.quantity")}
                value={tabarrukItem.quantity || "—"}
                ddClassName="text-sm"
              />
              <StatRow
                label={t("sessions.tabarruk.form.date")}
                value={tabarrukItem.date ? formatDate(tabarrukItem.date) : "—"}
                ddClassName="text-sm text-muted-foreground"
              />
              <StatRow
                fullWidth
                label={t("sessions.tabarruk.form.occasion")}
                value={tabarrukItem.occasion || "—"}
                ddClassName="text-sm text-muted-foreground"
              />
            </StatGrid>
          </motion.article>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("sessions.tabarruk.tableCaption")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="item" className="px-3 py-2.5">{t("sessions.tabarruk.form.item")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="quantity" className="px-3 py-2.5">{t("sessions.tabarruk.form.quantity")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="occasion" className="px-3 py-2.5">{t("sessions.tabarruk.form.occasion")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="date" className="px-3 py-2.5">{t("sessions.tabarruk.form.date")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="actions" className="px-3 py-2.5 w-16"><span className="sr-only">{t("common.actions")}</span></ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {items.map((tabarrukItem, index) => (
              <motion.tr
                key={tabarrukItem.id}
                {...rowMotion(index * 0.04)}
                className="hover:bg-muted/20 transition-colors group"
              >
                <TableCell className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground m-0">{tabarrukItem.item}</p>
                  {tabarrukItem.note && <p className="text-xs text-muted-foreground m-0">{tabarrukItem.note}</p>}
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <span className="text-sm text-foreground">{tabarrukItem.quantity || "—"}</span>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">{tabarrukItem.occasion || "—"}</span>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">{tabarrukItem.date ? formatDate(tabarrukItem.date) : "—"}</span>
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  {canWrite && <div className="flex items-center gap-1 justify-end">
                    <Button aria-label={t("sessions.tabarruk.editNamed", { name: tabarrukItem.item })} onClick={() => onEdit(tabarrukItem)} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button aria-label={t("sessions.tabarruk.deleteNamed", { name: tabarrukItem.item })} onClick={() => onDelete(tabarrukItem)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
