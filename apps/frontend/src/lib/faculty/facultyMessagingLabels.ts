import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export type FacultyMessagingLabels = {
  call: string;
  whatsapp: string;
  sms: string;
  email: string;
};

export type TeacherMessagingLabels = FacultyMessagingLabels;

/** Localized messaging action labels shared by Faculty detail quick actions and card footer. */
export function facultyMessagingLabels(t: TranslationFunction): FacultyMessagingLabels {
  return {
    call: t("faculty.detail.call") || t("teachers.detail.call"),
    whatsapp: t("faculty.list.actionWhatsApp") || t("teachers.list.actionWhatsApp"),
    sms: t("faculty.list.actionSms") || t("teachers.list.actionSms"),
    email: t("faculty.list.actionEmail") || t("teachers.list.actionEmail"),
  };
}

export const teacherMessagingLabels = facultyMessagingLabels;
