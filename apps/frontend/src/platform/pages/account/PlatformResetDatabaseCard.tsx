import React, { useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useResetPlatformDatabase } from "@/platform/hooks/usePlatformSettings";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PlatformResetDatabaseCard(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogout } = usePlatformAuth();
  const resetDbMutation = useResetPlatformDatabase();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const confirmInputId = useId();

  const handleResetDatabase = async (): Promise<void> => {
    if (confirmText.trim() !== "RESET_ALL_DATABASE_DATA") return;
    setResetError(null);
    try {
      await resetDbMutation.mutateAsync(confirmText.trim());
      setResetDialogOpen(false);
      setConfirmText("");
      platformLogout();
      // Force a full page reload after a short delay to let the backend migrations complete
      // and ensure the client-side state/cache is completely cleared.
      setTimeout(() => {
        window.location.href = "/platform";
      }, 800);
    } catch (err) {
      setResetError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <>
      <Card accentColor="destructive" className="p-6 space-y-4 text-start border-destructive/10 bg-destructive/5">
        <h3 className="text-sm font-bold text-destructive">{t("platform.profileDestroyDatabase")}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("platform.profileDestroyDatabaseDesc")}
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-full font-bold h-10 rounded-xl cursor-pointer transition-all"
          onClick={() => {
            setResetError(null);
            setConfirmText("");
            setResetDialogOpen(true);
          }}
        >
          {t("platform.profileDestroyDatabaseButton")}
        </Button>
      </Card>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">{t("platform.profileDestroyDatabaseTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("platform.profileDestroyDatabaseDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-2 text-start">
            <label htmlFor={confirmInputId} className="block text-xs text-muted-foreground font-semibold cursor-pointer">
              {t("platform.profileDestroyDatabasePrompt")}
            </label>
            <Input
              id={confirmInputId}
              name="confirmResetText"
              type="text"
              value={confirmText}
              onChange={(event) => {
                setConfirmText(event.target.value);
                if (resetError) setResetError(null);
              }}
              placeholder="RESET_ALL_DATABASE_DATA"
              disabled={resetDbMutation.isPending}
              className="min-h-[44px]"
            />
            {resetError ? (
              <p className="text-xs text-destructive font-bold" role="alert">
                {resetError}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetDbMutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={resetDbMutation.isPending || confirmText.trim() !== "RESET_ALL_DATABASE_DATA"}
              onClick={handleResetDatabase}
            >
              {resetDbMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                  {t("platform.profileDestroyDatabaseConfirm")}
                </>
              ) : (
                t("platform.profileDestroyDatabaseConfirm")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
