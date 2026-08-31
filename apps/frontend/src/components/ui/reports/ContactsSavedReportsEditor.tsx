import React from "react";
import type { ContactsSavedReportShareScope } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersCollection } from "@/tenant/hooks/collections/users";

interface ContactsSavedReportUserPickerProps {
  value: string[];
  onChange: (userIds: string[]) => void;
}

function ContactsSavedReportUserPicker({
  value,
  onChange,
}: ContactsSavedReportUserPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const users = useUsersCollection();
  const options = (() => users.slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")))();

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
            <label key={user.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50">
              <Checkbox checked={value.includes(String(user.id))} onCheckedChange={() => toggle(String(user.id))} />
              <span className="truncate">{user.name || user.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

interface ContactsSavedReportsEditorProps {
  open: boolean;
  name: string;
  search: string;
  shareScope: ContactsSavedReportShareScope;
  shareScopeOptions: ContactsSavedReportShareScope[];
  sharedWithUserIds: string[];
  saving: boolean;
  searchLabel: string;
  shareLabel: (scope: ContactsSavedReportShareScope | undefined) => string;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onShareScopeChange: (value: ContactsSavedReportShareScope) => void;
  onSharedWithUserIdsChange: (userIds: string[]) => void;
  onSave: () => void;
}

export function ContactsSavedReportsEditor({
  open,
  name,
  search,
  shareScope,
  shareScopeOptions,
  sharedWithUserIds,
  saving,
  searchLabel,
  shareLabel,
  onClose,
  onNameChange,
  onSearchChange,
  onShareScopeChange,
  onSharedWithUserIdsChange,
  onSave,
}: ContactsSavedReportsEditorProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("contacts.savedReports.saveDialogTitle")}
      size="sm"
      cancelLabel={t("common.cancel")}
      saveLabel={t("contacts.savedReports.save")}
      onSave={onSave}
      saving={saving}
      saveDisabled={!name.trim() || (shareScope === "users" && sharedWithUserIds.length === 0)}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="saved-report-name">{t("contacts.savedReports.nameLabel")}</Label>
          <Input
            id="saved-report-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t("contacts.savedReports.namePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="saved-report-search">{searchLabel}</Label>
          <Input
            id="saved-report-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("contacts.savedReports.searchPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saved-report-share-scope">{t("contacts.savedReports.shareScopeLabel")}</Label>
          <FormSelect
            id="saved-report-share-scope"
            value={shareScope}
            onChange={(value) => onShareScopeChange(value as ContactsSavedReportShareScope)}
            options={shareScopeOptions.map((scope) => ({
              value: scope,
              label: shareLabel(scope),
            }))}
          />
        </div>
        {shareScope === "users" && (
          <ContactsSavedReportUserPicker value={sharedWithUserIds} onChange={onSharedWithUserIdsChange} />
        )}
      </div>
    </FormModal>
  );
}
