import React, { useState, lazy, Suspense, useMemo } from "react";
import {
  Receipt,
  Printer,
  User,
  Users,
  Bookmark,
  Target,
  UserCheck,
  ShieldCheck,
  Coins,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  type ObligationCollection,
  type ObligationType,
  type MujtahidRep,
  type Mujtahid,
  type WakalaType,
  type ObligationDistribution,
} from "@/lib/data/obligationsData";
import { DEFAULT_CURRENCIES, formatMoney, formatDate } from "@mms/shared";
import {
  useMergedObligationContacts,
  useMergedObligationUsers,
} from "@/tenant/features/obligations/hooks/useObligationLookups";
import { DetailSheet } from "@/components/common/DetailSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";
import {
  DetailDrawerArchivedBanner,
  DetailDrawerRestoreOrEditAction,
} from "@/components/ui/DetailDrawerArchiveChrome";

const PrintInvoiceModal = lazy(() =>
  import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({
    default: module.PrintInvoiceModal,
  }))
);

const InvoiceTemplateEditor = lazy(() =>
  import("@/tenant/features/obligations/components/invoice/InvoiceTemplateEditor").then((module) => ({
    default: module.InvoiceTemplateEditor,
  }))
);

export interface ObligationCollectionDetailProps {
  collection: ObligationCollection;
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  distributions: ObligationDistribution[];
  wakalaTypes: WakalaType[];
  onClose: () => void;
  canDelete?: boolean;
  onRestore?: (id: string) => void | Promise<void>;
}

/**
 * Displays obligation collection details including distribution breakdown.
 */
export const ObligationCollectionDetail = function ObligationCollectionDetail({
  collection,
  obligationTypes,
  reps,
  mujtahids,
  distributions,
  wakalaTypes,
  onClose,
  canDelete = false,
  onRestore,
}: ObligationCollectionDetailProps) {
  const { t } = useTranslation();
  const { viewMode } = useWorkDirectoryViewMode();
  const currencies = DEFAULT_CURRENCIES;
  const [showPrint, setShowPrint] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorFromPrint, setEditorFromPrint] = useState(false);

  const contactIds = useMemo(
    () => [collection.sender_id, collection.reference_id],
    [collection.sender_id, collection.reference_id]
  );
  const userIds = useMemo(
    () => [collection.received_by],
    [collection.received_by]
  );

  const contacts = useMergedObligationContacts(contactIds);
  const users = useMergedObligationUsers(userIds);

  const distributionTypeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      Income: { label: t("obligations.distribution.income"), cls: SEMANTIC_BADGE.success },
      Liability: { label: t("obligations.distribution.liability"), cls: SEMANTIC_BADGE.info },
    }),
    [t]
  );

  const paymentModeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
      Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
    }),
    [t]
  );

  const sender = useMemo(
    () => contacts.find((contact) => String(contact.id) === String(collection.sender_id)),
    [contacts, collection.sender_id]
  );
  const reference = useMemo(
    () => (collection.reference_id ? contacts.find((contact) => String(contact.id) === String(collection.reference_id)) : null),
    [contacts, collection.reference_id]
  );
  const currency = useMemo(
    () => currencies.find((currencyOption) => currencyOption.id === collection.currency_id),
    [currencies, collection.currency_id]
  );
  const user = useMemo(
    () => users.find((u) => String(u.id) === String(collection.received_by)),
    [users, collection.received_by]
  );
  const rep = useMemo(
    () => reps.find((r) => r.id === collection.mujtahid_representative_id),
    [reps, collection.mujtahid_representative_id]
  );
  const mujtahid = useMemo(
    () => (rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null),
    [rep, mujtahids]
  );
  const obType = useMemo(
    () => obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id),
    [obligationTypes, collection.obligation_type_id]
  );

  const wakalaType = useMemo(
    () =>
      wakalaTypes.find(
        (wakalaTypeItem) =>
          wakalaTypeItem.obligation_type_id === collection.obligation_type_id &&
          wakalaTypeItem.mujtahid_representative_id === collection.mujtahid_representative_id
      ),
    [wakalaTypes, collection.obligation_type_id, collection.mujtahid_representative_id]
  );

  const dists = useMemo(
    () => (wakalaType ? distributions.filter((distribution) => distribution.wakala_type_id === wakalaType.id) : []),
    [wakalaType, distributions]
  );

  const { totalPct, totalAmount } = useMemo(() => {
    const pct = dists.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);
    const amt = (collection.amount * pct) / 100;
    return { totalPct: pct, totalAmount: amt };
  }, [dists, collection.amount]);

  const isArchived = Boolean(collection.deletedAt);

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={t("obligations.detail.title")}
      icon={Receipt}
      className="max-w-2xl"
      headerExtra={isArchived ? <DetailDrawerArchivedBanner deletedAt={collection.deletedAt} /> : undefined}
      headerActions={
        onRestore ? (
          <DetailDrawerRestoreOrEditAction
            isArchived={isArchived}
            canRestore={canDelete}
            onRestore={() => onRestore(collection.id)}
            restoreLabel={t("common.restore")}
          />
        ) : undefined
      }
    >
      <div className="space-y-5">
        <Card className="p-4 flex items-center gap-3.5 bg-primary/5 border-primary/25">
          <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{t("obligations.columns.receiptNo")}</p>
            <p className="text-xl font-bold text-primary font-mono m-0">{collection.receipt_no}</p>
          </div>
          <div className="ms-auto text-end">
            <p className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("obligations.columns.receivedDate")}</p>
            <p className="text-sm font-semibold text-foreground m-0">{formatDate(collection.received_date)}</p>
          </div>
        </Card>

        <div className="space-y-2">
          <DetailSectionTitle>{t("obligations.detail.title")}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" icon={User} label={t("obligations.columns.sender")} value={sender?.name} />
            {reference && <DetailAttributeRow variant="inset" icon={Users} label={t("obligations.form.reference")} value={reference?.name} />}
            <DetailAttributeRow variant="inset" icon={Bookmark} label={t("obligations.columns.obligationType")} value={obType?.name} />
            {obType?.designated_for && (
              <DetailAttributeRow variant="inset" icon={Target} label={t("obligations.detail.designatedFor")} value={obType.designated_for} />
            )}
            <DetailAttributeRow variant="inset" icon={UserCheck} label={t("obligations.form.representative")} value={rep?.name} />
            <DetailAttributeRow variant="inset" icon={ShieldCheck} label={t("obligations.form.mujtahidLabel")} value={mujtahid?.name} />
            <DetailAttributeRow
              variant="inset"
              icon={Coins}
              label={t("obligations.columns.amount")}
              value={<span className="font-mono">{formatMoney(collection.amount, currency?.code)}</span>}
            />
            <DetailAttributeRow
              variant="inset"
              icon={CreditCard}
              label={t("obligations.columns.paymentMode")}
              value={<StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />}
            />
            <DetailAttributeRow variant="inset" icon={UserCheck} label={t("obligations.form.receivedBy")} value={user?.name} />
            <DetailAttributeRow variant="inset" icon={Clock} label={t("obligations.detail.created")} value={formatDate(collection.created_at)} />
          </Card>
        </div>

        {dists.length > 0 && (
          <section aria-label={t("obligations.detail.distribution")}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 m-0">{t("obligations.detail.distribution")}</h4>
            <div className={WORK_SURFACE}>
              {viewMode === "cards" ? (
                <div className="space-y-3 p-3">
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
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border/50 text-xs font-semibold">
                    <span>{t("reports.fields.total")}</span>
                    <span className="font-mono">
                      {totalPct}% • {formatMoney(totalAmount, currency?.code)}
                    </span>
                  </div>
                </div>
              ) : (
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
                  <TableFooter className="bg-muted/40 font-semibold border-t border-border">
                    <TableRow>
                      <TableCell colSpan={2} className="px-5 py-2.5 text-foreground">{t("reports.fields.total")}</TableCell>
                      <TableCell className="px-4 py-2.5 text-end font-mono text-xs font-bold">{totalPct}%</TableCell>
                      <TableCell className="px-5 py-2.5 text-end font-mono text-xs font-bold text-foreground">
                        {formatMoney(totalAmount, currency?.code)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
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
          {!isArchived && (
            <Button type="button" onClick={() => setShowPrint(true)} className="gap-2">
              <Printer className="w-4 h-4" aria-hidden="true" /> {t("obligations.actions.printShort")}
            </Button>
          )}
          <Button type="button" onClick={onClose} variant="outline">
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
            onOpenEditor={() => {
              setShowPrint(false);
              setEditorFromPrint(true);
              setShowEditor(true);
            }}
          />
        </Suspense>
      )}
      {showEditor && (
        <Suspense fallback={null}>
          <InvoiceTemplateEditor
            collection={collection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => {
              setShowEditor(false);
              if (editorFromPrint) {
                setEditorFromPrint(false);
                setShowPrint(true);
              }
            }}
          />
        </Suspense>
      )}
    </DetailSheet>
  );
};
