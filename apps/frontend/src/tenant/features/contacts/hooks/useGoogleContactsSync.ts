import { useEffect, useState } from "react";
import {
  useContactGoogleSyncConfig,
  useContactGoogleSyncMutations,
  CONTACTS_GOOGLE_SYNC_QUERY_KEY,
} from "@/tenant/features/contacts/hooks/useContacts";
import { useGoogleContactsOAuth } from "@/tenant/features/contacts/hooks/useGoogleContactsOAuth";
import { useInvalidateContactsQueries } from "@/tenant/features/contacts/hooks/useContactMutations";
import { useTranslation } from "@/hooks/useTranslation";
import { type AppTranslationKey, type ContactGoogleSyncConfigClient } from "@mms/shared";
import { isApiError } from "@/lib/apiClient";
import { queryClientInstance } from "@/lib/queryClient";

function mapGoogleSyncError(
  error: unknown,
  translate: (key: AppTranslationKey) => string,
): string {
  if (isApiError(error)) {
    if (error.type === "session_expired") return translate("contacts.sync.sessionExpired");
    if (error.type === "forbidden") return translate("errors.state.permission");
    return translate("contacts.sync.oauthError");
  }
  return translate("contacts.sync.oauthError");
}

export function useGoogleContactsSync({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const { t } = useTranslation();
  const invalidateContacts = useInvalidateContactsQueries();
  const { data: serverConfig, isLoading: configLoading } = useContactGoogleSyncConfig({
    enabled: canWrite,
  });
  const { saveConfig, logSyncAudit, exchangeOAuth, runGoogleSync } = useContactGoogleSyncMutations();
  const [config, setConfig] = useState<ContactGoogleSyncConfigClient>({});
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState({ clientId: "", clientSecret: "" });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    skippedName: number;
    skippedUnique: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (serverConfig) {
      setConfig({ clientId: serverConfig.clientId });
    }
  }, [serverConfig]);

  useEffect(() => {
    setForm({ clientId: config.clientId || "", clientSecret: config.clientSecret || "" });
  }, [config.clientId, config.clientSecret]);

  const isConfigured = !!(config.clientId && (config.clientSecret || serverConfig?.hasClientSecret));
  const isConnected = serverConfig?.isConnected ?? false;

  const { handleConnect, handleExchangeCode } = useGoogleContactsOAuth({
    canWrite,
    config,
    setConfig,
    isConfigured,
    configLoading,
    exchangeOAuth,
    setError,
    setShowAuthCode,
    setAuthCode,
    setExchanging,
    t,
  });

  const handleSaveCredentials = async (): Promise<void> => {
    if (!canWrite) return;
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError(t("contacts.sync.clientIdRequired"));
      return;
    }
    const updatedConfig: ContactGoogleSyncConfigClient = {
      ...config,
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
    };
    try {
      await saveConfig.mutateAsync(updatedConfig);
      setConfig(updatedConfig);
      setShowSetup(false);
      setError("");
      void logSyncAudit.mutateAsync({ action: "credentials_saved" });
    } catch (saveError) {
      setError(mapGoogleSyncError(saveError, t));
    }
  };

  const handleSync = async (): Promise<void> => {
    if (!canWrite || !isConnected) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const result = await runGoogleSync.mutateAsync();
      // Server already persisted imports via bulkSave — invalidate, do not re-upsert.
      invalidateContacts();
      await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
      setSyncResult({
        total: result.total,
        imported: result.imported,
        skipped: result.skipped,
        skippedName: result.skippedName ?? 0,
        skippedUnique: result.skippedUnique ?? 0,
      });
    } catch (syncError) {
      if (isApiError(syncError) && syncError.type === "session_expired") {
        await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
      }
      setError(mapGoogleSyncError(syncError, t));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!canWrite) return;
    const disconnectedConfig: ContactGoogleSyncConfigClient = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    };
    try {
      await saveConfig.mutateAsync({ clientId: config.clientId, clearTokens: true });
      setConfig(disconnectedConfig);
      void logSyncAudit.mutateAsync({ action: "disconnected" });
      await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
      setSyncResult(null);
      setError("");
      setShowAuthCode(false);
      setAuthCode("");
    } catch (disconnectError) {
      setError(mapGoogleSyncError(disconnectError, t));
    }
  };

  return {
    canWrite,
    form,
    setForm,
    showSetup,
    setShowSetup,
    syncing,
    syncResult,
    error,
    setError,
    showAuthCode,
    authCode,
    setAuthCode,
    exchanging,
    isConfigured,
    isConnected,
    handleSaveCredentials,
    handleConnect,
    handleExchangeCode: () => handleExchangeCode(authCode),
    handleSync,
    handleDisconnect,
  };
}
