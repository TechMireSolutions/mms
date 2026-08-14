import React, { useState } from "react";
import { RESET_DATABASE_CONFIRM } from "@mms/shared";
import { Flame } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useResetPlatformDatabase } from "@/platform/hooks/usePlatformSettings";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { clearAllClientStorage } from "@/lib/db";
import { PlatformTypedConfirmDialog } from "@/platform/components/PlatformTypedConfirmDialog";

export function PlatformResetDatabaseCard(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogout } = usePlatformAuth();
  const resetDbMutation = useResetPlatformDatabase();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetDatabase = async (): Promise<void> => {
    if (confirmText.trim() !== RESET_DATABASE_CONFIRM || !password.trim()) return;
    setResetError(null);
    try {
      await resetDbMutation.mutateAsync({
        confirm: confirmText.trim(),
        password,
      });
      setResetDialogOpen(false);
      setConfirmText("");
      setPassword("");
      clearAllClientStorage();
      await platformLogout();
      setTimeout(() => {
        window.location.href = ROUTES.home;
      }, 800);
    } catch (err) {
      setResetError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <>
      <SectionCard
        accentColor="destructive"
        title={t("platform.profileDestroyDatabase")}
        subtitle={t("platform.profileDestroyDatabaseDesc")}
        icon={Flame}
        className="text-start"
      >
        <Button
          type="button"
          variant="destructive"
          className="w-full font-bold min-h-11 rounded-xl cursor-pointer transition-all"
          onClick={() => {
            setResetError(null);
            setConfirmText("");
            setPassword("");
            setResetDialogOpen(true);
          }}
        >
          {t("platform.profileDestroyDatabaseButton")}
        </Button>
      </SectionCard>

      <PlatformTypedConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title={t("platform.profileDestroyDatabaseTitle")}
        description={t("platform.profileDestroyDatabaseDesc")}
        confirmLabel={t("platform.profileDestroyDatabasePrompt", {
          confirm: RESET_DATABASE_CONFIRM,
        })}
        expectedConfirm={RESET_DATABASE_CONFIRM}
        confirmValue={confirmText}
        onConfirmValueChange={(value) => {
          setConfirmText(value);
          if (resetError) setResetError(null);
        }}
        confirmInputName="confirmResetText"
        confirmPlaceholder={RESET_DATABASE_CONFIRM}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          if (resetError) setResetError(null);
        }}
        passwordInputId="reset-db-password"
        passwordInputName="resetDbPassword"
        error={resetError}
        pending={resetDbMutation.isPending}
        confirmButtonLabel={t("platform.profileDestroyDatabaseConfirm")}
        confirmVariant="destructive"
        onConfirm={() => void handleResetDatabase()}
      />
    </>
  );
}
