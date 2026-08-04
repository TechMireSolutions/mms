import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { MIGRATE_AND_RESTART_CONFIRM } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useMigrateAndRestartPlatform,
  waitForBackendReadyAfterMigrate,
} from "@/platform/hooks/usePlatformSettings";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { notify } from "@/lib/notify";
import { PlatformTypedConfirmDialog } from "@/platform/components/PlatformTypedConfirmDialog";

export function PlatformMigrateRestartCard(): React.JSX.Element {
  const { t } = useTranslation();
  const migrateMutation = useMigrateAndRestartPlatform();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [waitingForReady, setWaitingForReady] = useState(false);

  const isBusy = migrateMutation.isPending || waitingForReady;

  const handleMigrateAndRestart = async (): Promise<void> => {
    if (confirmText.trim() !== MIGRATE_AND_RESTART_CONFIRM || !password.trim()) return;
    setFormError(null);
    try {
      const result = await migrateMutation.mutateAsync({
        confirm: confirmText.trim(),
        password,
      });
      setDialogOpen(false);
      setConfirmText("");
      setPassword("");
      setWaitingForReady(true);
      notify.info(t("platform.profileMigrateRestartWaiting"));
      await waitForBackendReadyAfterMigrate(result.delayMs);
      window.location.reload();
    } catch (err) {
      setFormError(getPlatformErrorMessage(err, t));
      setWaitingForReady(false);
    }
  };

  return (
    <>
      <Card className="p-6 space-y-4 text-start">
        <h3 className="text-sm font-bold text-foreground">{t("platform.profileMigrateRestart")}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("platform.profileMigrateRestartDesc")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full font-bold min-h-11 rounded-xl cursor-pointer transition-all"
          disabled={isBusy}
          onClick={() => {
            setFormError(null);
            setConfirmText("");
            setPassword("");
            setDialogOpen(true);
          }}
        >
          {waitingForReady ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
              {t("platform.profileMigrateRestartWaiting")}
            </>
          ) : (
            t("platform.profileMigrateRestartButton")
          )}
        </Button>
      </Card>

      <PlatformTypedConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t("platform.profileMigrateRestartTitle")}
        description={t("platform.profileMigrateRestartDesc")}
        confirmLabel={t("platform.profileMigrateRestartPrompt", {
          confirm: MIGRATE_AND_RESTART_CONFIRM,
        })}
        expectedConfirm={MIGRATE_AND_RESTART_CONFIRM}
        confirmValue={confirmText}
        onConfirmValueChange={(value) => {
          setConfirmText(value);
          if (formError) setFormError(null);
        }}
        confirmInputName="confirmMigrateRestartText"
        confirmPlaceholder={MIGRATE_AND_RESTART_CONFIRM}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          if (formError) setFormError(null);
        }}
        passwordInputId="migrate-restart-password"
        passwordInputName="migrateRestartPassword"
        error={formError}
        pending={isBusy}
        confirmButtonLabel={t("platform.profileMigrateRestartConfirm")}
        confirmVariant="default"
        destructiveTitle={false}
        onConfirm={() => void handleMigrateAndRestart()}
      />
    </>
  );
}
