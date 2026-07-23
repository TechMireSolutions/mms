import React, { memo, useEffect, useState } from "react";
import { ExternalLink, Loader2, Trash2, Globe, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlatformWorkspaceRow } from "@mms/shared";
import { getAppDomain, tenantUrl } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useDeleteWorkspace,
  usePlatformWorkspaces,
  useSetWorkspaceEnabled,
} from "@/platform/hooks/usePlatformWorkspaces";
import { isApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import WorkspaceLogo from "@/platform/components/WorkspaceLogo";
import PasswordInput from "@/components/ui/PasswordInput";
import { SearchBar } from "@/components/ui/SearchBar";
import { SubTabBar } from "@/components/ui/SubTabBar";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * Super-user workspace list with enable/disable and delete controls.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const deleteWorkspace = useDeleteWorkspace();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  if (isLoading) {
    return <RouteStatusFallback />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("apex.loadError")}
        onRetry={() => void refetch()}
      />
    );
  }

  const items = workspaces ?? [];

  const filteredItems = items.filter((workspace) => {
    const matchesSearch =
      workspace.madrasaName.toLowerCase().includes(search.toLowerCase()) ||
      workspace.subdomain.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && workspace.enabled) ||
      (statusFilter === "inactive" && !workspace.enabled);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 w-full text-start">
      {/* Search and Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("common.search")}
          className="w-full md:max-w-md"
        />
        <SubTabBar
          tabs={[
            { key: "all", label: t("attendance.filter.all") },
            { key: "active", label: t("platform.workspaceActive"), icon: Globe },
            { key: "inactive", label: t("platform.workspaceInactive"), icon: Ban },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={search ? t("platform.noAdmins") : t("apex.noMadrasasYet")}
          description={search ? "No workspaces match your search criteria" : undefined}
          compact
        />
      ) : (
        <motion.ul 
          layout
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((workspace) => (
              <WorkspaceRow
                key={workspace.subdomain}
                workspace={workspace}
                appDomain={appDomain}
                togglePending={setEnabled.isPending && setEnabled.variables?.subdomain === workspace.subdomain}
                deletePending={deleteWorkspace.isPending && deleteWorkspace.variables?.subdomain === workspace.subdomain}
                onToggle={(enabled) => setEnabled.mutate({ subdomain: workspace.subdomain, enabled })}
                onDelete={(password) =>
                  deleteWorkspace.mutateAsync({ subdomain: workspace.subdomain, password })
                }
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

const WorkspaceRow = memo(function WorkspaceRow({
  workspace,
  appDomain,
  togglePending,
  deletePending,
  onToggle,
  onDelete,
}: {
  workspace: PlatformWorkspaceRow;
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  onToggle: (enabled: boolean) => void;
  onDelete: (password: string) => Promise<unknown>;
}): React.JSX.Element {
  const { t } = useTranslation();
  const tenantLink = tenantUrl(workspace.subdomain, "/");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const busy = togglePending || deletePending;

  useEffect(() => {
    if (!confirmOpen) {
      setPassword("");
      setPasswordError(null);
    }
  }, [confirmOpen]);

  const handleDelete = (): void => {
    if (!password.trim()) {
      setPasswordError(t("platform.deleteWorkspacePasswordHint"));
      return;
    }
    setPasswordError(null);
    void onDelete(password)
      .then(() => setConfirmOpen(false))
      .catch((error: unknown) => {
        if (isApiError(error) && error.type === "invalid_current_password") {
          setPasswordError(t("platform.profileWrongPassword"));
        }
      });
  };

  return (
    <>
      <motion.li
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="h-full"
      >
        <Card
          accentColor={!workspace.enabled ? "destructive" : undefined}
          className="p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 h-full text-start"
        >
          <div className="flex items-start gap-4">
            <div className="relative group-hover:scale-105 transition-transform duration-300">
              <WorkspaceLogo logoUrl={workspace.logoUrl} madrasaName={workspace.madrasaName} className="h-12 w-12 rounded-xl border border-border/30" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground truncate">{workspace.madrasaName}</p>
              <p className="text-xs text-muted-foreground font-mono break-all opacity-85">
                {workspace.subdomain}.{appDomain}
              </p>
              {!workspace.enabled ? (
                <div className="mt-1">
                  <StatusBadge
                    status="disabled"
                    config={{
                      disabled: {
                        label: t("platform.workspaceDisabledBadge"),
                        cls: "bg-destructive/15 text-destructive border-destructive/20",
                      },
                    }}
                    size="sm"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <Label htmlFor={`ws-enabled-${workspace.subdomain}`} className="text-xs text-muted-foreground sr-only">
                  {t("platform.toggleWorkspace", { name: workspace.madrasaName })}
                </Label>
                <Switch
                  id={`ws-enabled-${workspace.subdomain}`}
                  checked={workspace.enabled}
                  disabled={busy}
                  onCheckedChange={onToggle}
                />
              </div>
              <StatusBadge
                status={workspace.enabled ? "active" : "inactive"}
                config={{
                  active: {
                    label: t("platform.workspaceActive"),
                    cls: "bg-success/10 text-success border-success/20",
                  },
                  inactive: {
                    label: t("platform.workspaceInactive"),
                    cls: "bg-destructive/10 text-destructive border-destructive/20",
                  },
                }}
                size="sm"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
            {workspace.enabled ? (
              <a
                href={tenantLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:text-primary/95 transition-colors group/link"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-250" aria-hidden />
                {t("platform.openWorkspace")}
              </a>
            ) : (
              <div className="w-4 h-4" /> // placeholder
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className="h-8 px-2.5 rounded-lg text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 me-1.5" aria-hidden />
              {t("platform.deleteWorkspace")}
            </Button>
          </div>
        </Card>
      </motion.li>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">{t("platform.deleteWorkspaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("platform.deleteWorkspaceDesc", {
                name: workspace.madrasaName,
                subdomain: workspace.subdomain,
                domain: appDomain,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2.5 my-2">
            <PasswordInput
              id={`delete-pw-${workspace.subdomain}`}
              label={t("platform.profileCurrentPassword")}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError(null);
              }}
              disabled={deletePending}
            />
            <p className="text-xs text-muted-foreground">{t("platform.deleteWorkspacePasswordHint")}</p>
            {passwordError ? (
              <p className="text-xs text-destructive font-semibold" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>{t("common.cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending || !password.trim()}
              onClick={handleDelete}
            >
              {deletePending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                  {t("platform.deleteWorkspaceConfirm")}
                </>
              ) : (
                t("platform.deleteWorkspaceConfirm")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

