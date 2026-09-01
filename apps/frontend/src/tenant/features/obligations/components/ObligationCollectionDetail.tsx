import React, { useState, lazy, Suspense } from "react";
import { Receipt, Printer } from "lucide-react";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid, WakalaType, ObligationDistribution } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES, formatMoney, formatDate } from '@mms/shared';
import { useMergedObligationContacts, useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';
import { InvoiceTemplateEditor } from "@/tenant/features/obligations/components/invoice/InvoiceTemplateEditor";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));

export interface ObligationCollectionDetailProps {
  collection: ObligationCollection;
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  distributions: ObligationDistribution[];
  wakalaTypes: WakalaType[];
  onClose: () => void;
}

/**
 * Displays obligation collection details including distribution breakdown.
 */
export const ObligationCollectionDetail = (function ObligationCollectionDetail({
  collection,
  obligationTypes,
  reps,
  mujtahids,
  distributions,
  wakalaTypes,
  onClose,
}: ObligationCollectionDetailProps) {
  const { t } = useTranslation();
  const currencies = DEFAULT_CURRENCIES;
  const [showPrint, setShowPrint] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const contactIds = (() => [collection.sender_id, collection.reference_id])();
  const contacts = useMergedObligationContacts(contactIds);
  const users = useMergedObligationUsers([collection.received_by]);

  const distributionTypeConfig = (() => ({
    Income: { label: t("obligations.distribution.income"), cls: SEMANTIC_BADGE.success },
    Liability: { label: t("obligations.distribution.liability"), cls: SEMANTIC_BADGE.info },
  }))() as Record<string, StatusBadgeConfigItem>;

  const paymentModeConfig = (() => ({
    Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
    Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
  }))() as Record<string, StatusBadgeConfigItem>;

  const sender = (() => contacts.find((contact) => String(contact.id) === String(collection.sender_id)))();
  const reference = (() => (collection.reference_id ? contacts.find((contact) => String(contact.id) === String(collection.reference_id)) : null))();
  const currency = (() => currencies.find((currencyOption) => currencyOption.id === collection.currency_id))();
  const user = (() => users.find((u) => String(u.id) === String(collection.received_by)))();
  const rep = (() => reps.find((r) => r.id === collection.mujtahid_representative_id))();
  const mujtahid = (() => (rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null))();
  const obType = (() => obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id))();

  const wakalaType = (() =>
      wakalaTypes.find(
        (wakalaTypeItem) =>
          wakalaTypeItem.obligation_type_id === collection.obligation_type_id &&
          wakalaTypeItem.mujtahid_representative_id === collection.mujtahid_representative_id,
      ))();

  const dists = (() => (wakalaType ? distributions.filter((distribution) => distribution.wakala_type_id === wakalaType.id) : []))();

  return (
    <DetailDrawerShell open onClose={onClose} title={t("obligations.detail.title")} icon={Receipt} className="max-w-2xl">
      <div className="space-y-5">
        <Card className="p-4 flex items-center gap-3.5 bg-primary/5 border-primary/25">
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{t("obligations.columns.receiptNo")}</h3>
            <p className="text-xl font-bold text-primary font-mono m-0">{collection.receipt_no}</p>
          </div>
          <div className="ms-auto text-end">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("obligations.columns.receivedDate")}</h3>
            <p className="text-sm font-semibold text-foreground m-0">{formatDate(collection.received_date)}</p>
          </div>
        </Card>

        <div className="space-y-2">
          <DetailSectionTitle>{t("obligations.detail.title")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" label={t("obligations.columns.sender")} value={sender?.name} />
            {reference && <DetailAttributeRow variant="inset" label={t("obligations.form.reference")} value={reference?.name} />}
            <DetailAttributeRow variant="inset" label={t("obligations.columns.obligationType")} value={obType?.name} />
            <DetailAttributeRow variant="inset" label={t("obligations.detail.designatedFor")} value={obType?.designated_for} />
            <DetailAttributeRow variant="inset" label={t("obligations.form.representative")} value={rep?.name} />
            <DetailAttributeRow variant="inset" label={t("obligations.form.mujtahidLabel")} value={mujtahid?.name} />
            <DetailAttributeRow variant="inset" label={t("obligations.columns.amount")} value={
              <span className="font-mono">{formatMoney(collection.amount, currency?.code)}</span>
            } />
            <div className="flex justify-between items-center px-3 py-2 border-b border-border/50 last:border-0 group/row">
              <span className="mb-1 block text-xs font-bold uppercase leading-none tracking-tight text-muted-foreground">{t("obligations.columns.paymentMode")}</span>
              <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
            </div>
            <DetailAttributeRow variant="inset" label={t("obligations.form.receivedBy")} value={user?.name} />
            <DetailAttributeRow variant="inset" label={t("obligations.detail.created")} value={formatDate(collection.created_at)} />
          </Card>
        </div>

        {dists.length > 0 && (
          <section aria-label={t("obligations.detail.distribution")}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 m-0">{t("obligations.detail.distribution")}</h4>
            <div className={WORK_SURFACE}>
              <div className="space-y-3 p-3 md:hidden">
                {dists.map((distribution) => (
                  <article key={distribution.id} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground m-0">{distribution.name}</p>
                      <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                    </div>
                    <StatGrid>
                      <StatRow
                        label={t("obligations.detail.colPct")}
                        value={`${distribution.percentage}%`}
                        ddClassName="font-mono text-xs font-semibold"
                      />
                      <StatRow
                        label={t("obligations.columns.amount")}
                        value={formatMoney((collection.amount * distribution.percentage) / 100, currency?.code)}
                        ddClassName="font-mono text-xs font-semibold"
                      />
                    </StatGrid>
                  </article>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <caption className="sr-only">{t("obligations.detail.distributionCaption", { receipt: collection.receipt_no })}</caption>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                      <ModuleTableHeaderCell columnKey="name" className="px-5 py-2">{t("obligations.detail.colName")}</ModuleTableHeaderCell>
                      <ModuleTableHeaderCell columnKey="type" className="px-4 py-2">{t("obligations.detail.colType")}</ModuleTableHeaderCell>
                      <ModuleTableHeaderCell columnKey="pct" className="px-4 py-2 text-end">{t("obligations.detail.colPct")}</ModuleTableHeaderCell>
                      <ModuleTableHeaderCell columnKey="amount" className="px-5 py-2 text-end">{t("obligations.columns.amount")}</ModuleTableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {dists.map((distribution) => (
                      <TableRow key={distribution.id} className="hover:bg-muted/20">
                        <TableCell className="px-5 py-2.5 font-medium text-foreground">{distribution.name}</TableCell>
                        <TableCell className="px-4 py-2.5">
                          <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-end font-mono text-xs font-semibold">{distribution.percentage}%</TableCell>
                        <TableCell className="px-5 py-2.5 text-end font-mono text-xs font-semibold text-foreground">
                          {formatMoney((collection.amount * distribution.percentage) / 100, currency?.code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        )}

        {dists.length === 0 && wakalaType && (
          <WarningCallout
            density="compact"
            role="alert"
            className="text-warning"
            description={t("obligations.detail.noDistribution")}
          />
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" onClick={() => setShowPrint(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Printer className="w-4 h-4" aria-hidden="true" /> {t("obligations.actions.printShort")}
          </Button>
          <Button type="button" onClick={onClose}
            variant="outline"
            className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            {t("common.close")}
          </Button>
        </footer>
      </div>

      {showPrint && (
        <Suspense fallback={null}>
          <PrintInvoiceModal
            collection={collection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => setShowPrint(false)}
            onOpenEditor={() => { setShowPrint(false); setShowEditor(true); }}
          />
        </Suspense>
      )}
      {showEditor && <InvoiceTemplateEditor onClose={() => setShowEditor(false)} />}
    </DetailDrawerShell>
  );
});
