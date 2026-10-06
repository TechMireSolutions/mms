import { useState } from "react";
import {
  findUnknownPersonalizationTokens,
  type MessageCategory,
  type MessageTemplate,
} from "@mms/shared";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessagingMutations } from "./useMessaging";

function formatUnknownTokensLabel(tokens: string[]): string {
  return tokens.map((token) => `{${token}}`).join(", ");
}

export function useMessagingTemplateEditor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { saveTemplate } = useMessagingMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<MessageCategory>("general");
  const [channel, setChannel] = useState<"all" | "sms" | "whatsapp" | "email">("all");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormDirty = Boolean(formOpen && (label.trim() || body.trim() || editingId));
  const unknownBodyTokens = findUnknownPersonalizationTokens(body);
  const saveDisabled =
    !label.trim() || !body.trim() || unknownBodyTokens.length > 0 || saveTemplate.isPending;

  const resetForm = (): void => {
    setFormOpen(false);
    setEditingId(null);
    setLabel("");
    setBody("");
    setCategory("general");
    setChannel("all");
    setErrors({});
  };

  const openCreate = (): void => {
    setEditingId(null);
    setLabel("");
    setBody("");
    setCategory("general");
    setChannel("all");
    setErrors({});
    setFormOpen(true);
  };

  const handleLabelChange = (value: string): void => {
    setLabel(value);
    if (errors.label) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.label;
        return next;
      });
    }
  };

  const handleBodyChange = (value: string): void => {
    setBody(value);
    const unknown = findUnknownPersonalizationTokens(value);
    setErrors((prev) => {
      const next = { ...prev };
      if (unknown.length > 0) {
        next.body = t("messaging.unknownTokens", {
          tokens: formatUnknownTokensLabel(unknown),
        });
      } else if (next.body) {
        delete next.body;
      }
      return next;
    });
  };

  const save = async (): Promise<void> => {
    if (!user) return;
    const newErrors: Record<string, string> = {};
    if (!label.trim()) newErrors.label = t("common.required");
    if (!body.trim()) newErrors.body = t("common.required");
    const unknownTokens = findUnknownPersonalizationTokens(body.trim());
    if (unknownTokens.length > 0) {
      newErrors.body = t("messaging.unknownTokens", {
        tokens: formatUnknownTokensLabel(unknownTokens),
      });
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (unknownTokens.length > 0) {
        notify.error(newErrors.body);
      } else {
        notify.error(t("messaging.createPresetDesc"));
      }
      return;
    }
    try {
      await saveTemplate.mutateAsync({
        body: { id: editingId ?? undefined, label: label.trim(), body: body.trim(), category, channel },
      });
      notify.success(t("messaging.saveTemplate"));
      resetForm();
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const handleEdit = (template: MessageTemplate): void => {
    setEditingId(template.id);
    setLabel(template.label);
    setBody(template.body);
    setCategory(template.category || "general");
    setChannel(template.channel || "all");
    setErrors({});
    setFormOpen(true);
  };

  const handleDuplicate = async (template: MessageTemplate): Promise<void> => {
    if (!user) return;
    const unknownTokens = findUnknownPersonalizationTokens(template.body);
    if (unknownTokens.length > 0) {
      notify.error(
        t("messaging.unknownTokens", { tokens: formatUnknownTokensLabel(unknownTokens) }),
      );
      return;
    }
    try {
      await saveTemplate.mutateAsync({
        body: {
          label: `${template.label} (${t("messaging.tagCustom")})`,
          body: template.body,
          category: template.category || "general",
          channel: template.channel || "all",
        },
      });
      notify.success(t("messaging.duplicateSuccess"));
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const handleCopy = async (templateBody: string): Promise<void> => {
    await navigator.clipboard.writeText(templateBody);
    notify.success(t("messaging.copySuccess"));
  };

  return {
    formOpen,
    editingId,
    label,
    body,
    category,
    setCategory,
    channel,
    setChannel,
    errors,
    isFormDirty,
    saving: saveTemplate.isPending,
    saveDisabled,
    resetForm,
    openCreate,
    handleLabelChange,
    handleBodyChange,
    save,
    handleEdit,
    handleDuplicate,
    handleCopy,
  };
}
