import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export type TeacherMessagingLabels = {
  call: string;
  whatsapp: string;
  sms: string;
  email: string;
};

/** Localized messaging action labels shared by Teachers detail quick actions and card footer. */
export function teacherMessagingLabels(t: TranslationFunction): TeacherMessagingLabels {
  return {
    call: t("teachers.detail.call"),
    whatsapp: t("teachers.list.actionWhatsApp"),
    sms: t("teachers.list.actionSms"),
    email: t("teachers.list.actionEmail"),
  };
}
