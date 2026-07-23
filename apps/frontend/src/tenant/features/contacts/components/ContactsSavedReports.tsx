import React, { useCallback, useMemo, useState } from "react";
import { Bookmark, Trash2, Play, Plus, Clock, User, AlertTriangle, Users } from "lucide-react";
import type { ContactsSavedReport, ContactsSavedReportShareScope, ContactsWorkDrillDown } from "@mms/shared";
import { formatDate, validateContactsSavedReportDrillDown } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useIsAdminViewer } from "@/tenant/hooks/useViewerRole";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import {
  useContactsSavedReportMutations,
  useContactsSavedReports,
} from "@/tenant/features/contacts/hooks/useContacts";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";
import { notify } from "@/lib/notify";
import { useUsersCollection } from "@/tenant/features/users/hooks/useUsersApi";
import { Checkbox } from "@/components/ui/checkbox";

interface ContactsSavedReportsProps {
  suggestedDrillDown?: ContactsWorkDrillDown;
}

function ContactsSavedReportUserPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (userIds: string[]) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const users = useUsersCollection();

  const options = useMemo(
    () => users.slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [users],
  );

  const toggle = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((selectedUserId) => selectedUserId !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{t("contacts.savedReports.usersPickerLabel")}</Label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{t("common.loading")}</p>
        ) : (
          options.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={value.includes(String(user.id))}
                onCheckedChange={() => toggle(String(user.id))}
              />
              <span className="truncate">{user.name || user.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function formatDrillDownSummary(
  drillDown: ContactsWorkDrillDown,
  searchLabel: string,
): string {
  const parts: string[] = [];
  if (drillDown.gender) parts.push(drillDown.gender);
  if (drillDown.search?.trim()) parts.push(`${searchLabel}: ${drillDown.search.trim()}`);
  return parts.join(" · ") || "—";
}

const SHARE_SCOPES: ContactsSavedReportShareScope[] = ["private", "roles", "users", "global"];

/** Contacts module saved reports — logic presets re-run against live data (globle1 §4.4). */
export default function ContactsSavedReports({
  suggestedDrillDown = {},
}: ContactsSavedReportsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { role } = usePermissions();
  const isAdmin = useIsAdminViewer();
  const { genders } = useContactConfig();
  const { data: reports = [], isLoading } = useContactsSavedReports();
  const { createSavedReport, deleteSavedReport, runSavedReport } = useContactsSavedReportMutations();

  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState(suggestedDrillDown.search ?? "");
  const [shareScope, setShareScope] = useState<ContactsSavedReportShareScope>("private");
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const searchLabel = t("contacts.savedReports.searchLabel");

  const shareScopeOptions = useMemo(() => {
    const scopes = [...SHARE_SCOPES];
    if (!isAdmin) return scopes.filter((scope) => scope !== "global");
    return scopes;
  }, [isAdmin]);

  const openSaveDialog = useCallback(() => {
    setName("");
    setSearch(suggestedDrillDown.search ?? "");
    setShareScope("private");
    setSharedWithUserIds([]);
    setSaveOpen(true);
  }, [suggestedDrillDown.search]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (shareScope === "users" && sharedWithUserIds.length === 0) {
      notify.error(t("contacts.savedReports.usersRequired"));
      return;
    }
    const drillDown: ContactsWorkDrillDown = {
      ...(search.trim() ? { search: search.trim() } : {}),
    };
    setSaving(true);
    try {
      await createSavedReport.mutateAsync({
        name: trimmedName,
        drillDown,
        shareScope,
        ...(shareScope === "roles" && role ? { sharedWithRoles: [role] } : {}),
        ...(shareScope === "users" ? { sharedWithUserIds } : {}),
      });
      notify.success(t("contacts.savedReports.saveSuccess"));
      setSaveOpen(false);
    } catch {
      notify.error(t("settings.serverSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [name, search, shareScope, sharedWithUserIds, role, createSavedReport, t]);

  const handleRun = useCallback(
    async (report: ContactsSavedReport) => {
      const issues = validateContactsSavedReportDrillDown(report.drillDown, {
        genders: genders,
      });
      if (issues.length > 0) {
        notify.error(t("contacts.savedReports.staleWarningTitle"), {
          description: t("contacts.savedReports.staleWarningDesc", {
            field: issues[0]?.value ?? "",
          }),
        });
      }
      try {
        await runSavedReport.mutateAsync(report.id);
        applyContactsWorkDrillDown(report.drillDown);
        notify.info(t("contacts.savedReports.runSuccess"), { description: report.name });
      } catch {
        notify.error(t("settings.serverSaveFailed"));
      }
    },
    [runSavedReport, t, genders],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSavedReport.mutateAsync(id);
        notify.info(t("contacts.savedReports.deleteSuccess"));
      } catch {
        notify.error(t("settings.serverSaveFailed"));
      }
    },
    [deleteSavedReport, t],
  );

  const formatLastRun = useMemo(
    () => (iso?: string) => {
      if (!iso) return t("contacts.savedReports.neverRun");
      return formatDate(iso);
    },
    [t],
  );

  const shareLabel = (scope: ContactsSavedReportShareScope | undefined): string => {
    const key = scope ?? "private";
    return t(`contacts.savedReports.shareScope.${key}` as "contacts.savedReports.shareScope.private");
  };

  const canSave = Boolean(user);

  return (
    <div className="space-y-4 border-t border-border/50 pt-6 mt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-foreground">{t("contacts.savedReports.title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("contacts.savedReports.subtitle")}</p>
        </div>
        {canSave && (
          <Button
            type="button"
            onClick={openSaveDialog}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("contacts.savedReports.saveCurrent")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t("contacts.savedReports.emptyTitle")}
          description={t("contacts.savedReports.emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((savedReport) => {
            const issues = validateContactsSavedReportDrillDown(savedReport.drillDown, {
              genders: genders,
            });
            return (
              <div
                key={savedReport.id}
                className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm flex flex-col gap-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{savedReport.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDrillDownSummary(savedReport.drillDown, searchLabel)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Users className="w-3 h-3" />
                        {shareLabel(savedReport.shareScope)}
                      </span>
                      {issues.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          {t("contacts.savedReports.staleBadge")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastRun(savedReport.lastRunAt)}
                  </span>
                  {(savedReport.createdByName || savedReport.createdBy) && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {savedReport.createdByName || savedReport.createdBy}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => void handleRun(savedReport)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline p-0 h-auto shadow-none"
                  >
                    <Play className="w-3 h-3" />
                    {t("contacts.savedReports.run")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleDelete(savedReport.id)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto p-0 h-auto hover:bg-transparent shadow-none"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t("contacts.savedReports.delete")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t("contacts.savedReports.saveDialogTitle")}
        size="sm"
        cancelLabel={t("common.cancel")}
        saveLabel={t("contacts.savedReports.save")}
        onSave={() => void handleSave()}
        saving={saving}
        saveDisabled={!name.trim() || (shareScope === "users" && sharedWithUserIds.length === 0)}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="saved-report-name">{t("contacts.savedReports.nameLabel")}</Label>
            <Input
              id="saved-report-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("contacts.savedReports.namePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="saved-report-search">{searchLabel}</Label>
            <Input
              id="saved-report-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("contacts.savedReports.searchPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="saved-report-share-scope">{t("contacts.savedReports.shareScopeLabel")}</Label>
            <FormSelect
              id="saved-report-share-scope"
              value={shareScope}
              onChange={(v) => {
                setShareScope(v as ContactsSavedReportShareScope);
                if (v !== "users") setSharedWithUserIds([]);
              }}
              options={shareScopeOptions.map((scope) => ({
                value: scope,
                label: shareLabel(scope),
              }))}
            />
          </div>
          {shareScope === "users" && (
            <ContactsSavedReportUserPicker value={sharedWithUserIds} onChange={setSharedWithUserIds} />
          )}
        </div>
      </FormModal>
    </div>
  );
}
