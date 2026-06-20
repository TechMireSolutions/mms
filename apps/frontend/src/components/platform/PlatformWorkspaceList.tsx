import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import type { PlatformWorkspaceRow } from "@mms/shared";
import { getAppDomain, tenantUrl } from "@/lib/config/tenantConfig";
import useTranslation from "@/hooks/useTranslation";
import {
  useDeleteWorkspace,
  usePlatformWorkspaces,
  useSetWorkspaceEnabled,
} from "@/hooks/usePlatformWorkspaces";
import { isApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Super-user workspace list with enable/disable and delete controls.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const deleteWorkspace = useDeleteWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" role="status">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">{t("apex.loadingMadrasas")}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center space-y-3"
      >
        <p className="text-sm text-destructive">{t("apex.loadError")}</p>
        <Button type="button" variant="ghost" size="sm" disabled={isFetching} onClick={() => void refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const items = workspaces ?? [];

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-2">{t("apex.noMadrasasYet")}</p>;
  }

  return (
    <div className="space-y-2 w-full text-left">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
        {t("platform.manageMadrasas")}
      </p>
      <ul className="space-y-3">
        {items.map((ws) => (
          <WorkspaceRow
            key={ws.subdomain}
            workspace={ws}
            appDomain={appDomain}
            togglePending={setEnabled.isPending && setEnabled.variables?.subdomain === ws.subdomain}
            deletePending={deleteWorkspace.isPending && deleteWorkspace.variables?.subdomain === ws.subdomain}
            onToggle={(enabled) => setEnabled.mutate({ subdomain: ws.subdomain, enabled })}
            onDelete={(password) =>
              deleteWorkspace.mutateAsync({ subdomain: ws.subdomain, password })
            }
          />
        ))}
      </ul>
    </div>
  );
}

function WorkspaceRow({
  workspace: ws,
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
  const tenantLink = tenantUrl(ws.subdomain, "/");
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
      <li
        className={`rounded-xl border-2 p-4 shadow-sm transition-colors ${
          ws.enabled ? "border-border bg-card" : "border-destructive/30 bg-destructive/5"
        }`}
      >
        <div className="flex items-start gap-3">
          {ws.logoUrl ? (
            <img
              src={ws.logoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-background border border-border shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary font-display text-base font-bold">م</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{ws.madrasaName}</p>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {ws.subdomain}.{appDomain}
            </p>
            {!ws.enabled ? (
              <p className="text-xs text-destructive mt-1">{t("platform.workspaceDisabledBadge")}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <Label htmlFor={`ws-enabled-${ws.subdomain}`} className="text-xs text-muted-foreground sr-only">
                {t("platform.toggleWorkspace", { name: ws.madrasaName })}
              </Label>
              <Switch
                id={`ws-enabled-${ws.subdomain}`}
                checked={ws.enabled}
                disabled={busy}
                onCheckedChange={onToggle}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {ws.enabled ? t("platform.workspaceActive") : t("platform.workspaceInactive")}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {ws.enabled ? (
            <a
              href={tenantLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" aria-hidden />
              {t("platform.openWorkspace")}
            </a>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ms-auto"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5 me-1" aria-hidden />
            {t("platform.deleteWorkspace")}
          </Button>
        </div>
      </li>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("platform.deleteWorkspaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("platform.deleteWorkspaceDesc", {
                name: ws.madrasaName,
                subdomain: ws.subdomain,
                domain: appDomain,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`delete-pw-${ws.subdomain}`}>{t("platform.profileCurrentPassword")}</Label>
            <Input
              id={`delete-pw-${ws.subdomain}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              disabled={deletePending}
            />
            <p className="text-xs text-muted-foreground">{t("platform.deleteWorkspacePasswordHint")}</p>
            {passwordError ? (
              <p className="text-xs text-destructive" role="alert">
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
}
