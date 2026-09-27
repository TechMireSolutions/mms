import { useState, type FormEvent } from "react";
import {
  findUnknownPersonalizationTokens,
  type MessageCategory,
  type MessageTemplate,
} from "@mms/shared";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessagingMutations } from "./useMessaging";

export function useMessagingTemplateEditor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { saveTemplate } = useMessagingMutations();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<MessageCategory>("general");
  const [channel, setChannel] = useState<"all" | "sms" | "whatsapp" | "email">("all");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormDirty = Boolean(label.trim() || body.trim() || editingId);

  const resetForm = (): void => {
    setEditingId(null);
    setLabel("");
    setBody("");
    setCategory("general");
    setChannel("all");
    setErrors({});
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
    if (errors.body) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.body;
        return next;
      });
    }
  };

  const save = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user) return;
    const newErrors: Record<string, string> = {};
    if (!label.trim()) newErrors.label = t("common.required");
    if (!body.trim()) newErrors.body = t("common.required");
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("messaging.createPresetDesc"));
      return;
    }
    const unknownTokens = findUnknownPersonalizationTokens(body.trim());
    if (unknownTokens.length > 0) {
      notify.error(t("messaging.unknownTokens", { tokens: unknownTokens.map((token) => `{${token}}`).join(", ") }));
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
  };

  const handleDuplicate = async (template: MessageTemplate): Promise<void> => {
    if (!user) return;
    const unknownTokens = findUnknownPersonalizationTokens(template.body);
    if (unknownTokens.length > 0) {
      notify.error(t("messaging.unknownTokens", { tokens: unknownTokens.map((token) => `{${token}}`).join(", ") }));
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
    editingId,
    label,
    body,
    category,
    setCategory,
    channel,
    setChannel,
    errors,
    isFormDirty,
    resetForm,
    handleLabelChange,
    handleBodyChange,
    save,
    handleEdit,
    handleDuplicate,
    handleCopy,
  };
}
