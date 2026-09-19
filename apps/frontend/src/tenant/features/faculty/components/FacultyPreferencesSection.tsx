import React, { useMemo } from "react";
import { Hash, SlidersHorizontal, Sparkles } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTeacherEmployeeId, type TeachersSettings } from "@mms/shared";

export interface TeachersPreferencesSectionProps {
  settingsDraft: TeachersSettings;
  upd: <K extends keyof TeachersSettings>(field: K, value: TeachersSettings[K]) => void;
  specializationOptions: string[];
}

const ID_TOKENS = [
  { tag: "{PREFIX}", label: "PREFIX" },
  { tag: "{YYYY}", label: "YYYY" },
  { tag: "{YY}", label: "YY" },
  { tag: "{MM}", label: "MM" },
  { tag: "{SEQ}", label: "SEQ" },
] as const;

/** Teachers Setup Preferences body — Students PreferencesSection analogue. */
export function TeachersPreferencesSection({
  settingsDraft,
  upd,
  specializationOptions,
}: TeachersPreferencesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  const livePreview = useMemo(() => {
    return formatTeacherEmployeeId(
      settingsDraft.idStartSeq || 1,
      settingsDraft,
    );
  }, [settingsDraft]);

  const insertToken = (tag: string) => {
    const current = settingsDraft.idTemplate ?? "{PREFIX}-{SEQ}";
    if (current.includes(tag)) return;
    // Insert before {SEQ} if present, otherwise append
    if (current.includes("{SEQ}")) {
      upd("idTemplate", current.replace("{SEQ}", `${tag}-{SEQ}`));
    } else {
      upd("idTemplate", `${current}-${tag}`);
    }
  };

  return (
    <div className="space-y-4 text-start">
      {/* Employee ID Format & Generation Card */}
      <SectionCard
        title={t("teachers.settings.idSectionTitle")}
        icon={Hash}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          {/* Live Preview Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {t("teachers.settings.preview")}
              </span>
            </div>
            <Badge
              variant="default"
              className="font-mono text-sm px-3 py-1 font-semibold tracking-wider bg-primary text-primary-foreground shadow-xs"
            >
              {livePreview}
            </Badge>
          </div>

          {/* Template Input with Quick Token Badges */}
          <div>
            <Field
              label={t("teachers.settings.idTemplate")}
              hint={t("teachers.settings.idTemplateHint")}
              id="teacher-idTemplate"
            >
              <Input
                id="teacher-idTemplate"
                name="teacher-idTemplate"
                className={FORM_INPUT}
                value={settingsDraft.idTemplate ?? "{PREFIX}-{SEQ}"}
                onChange={(event) => upd("idTemplate", event.target.value)}
                placeholder={t("teachers.settings.idTemplatePlaceholder")}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-muted-foreground me-1">
                {t("teachers.settings.availableTokens")}:
              </span>
              {ID_TOKENS.map((token) => (
                <button
                  key={token.tag}
                  type="button"
                  onClick={() => insertToken(token.tag)}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 cursor-pointer"
                >
                  {token.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix, Digits, Start Sequence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label={t("teachers.settings.idPrefix")}
              hint={t("teachers.settings.idPrefixHint")}
              id="teacher-idPrefix"
            >
              <Input
                id="teacher-idPrefix"
                name="teacher-idPrefix"
                className={FORM_INPUT}
                value={settingsDraft.idPrefix || ""}
                onChange={(event) => upd("idPrefix", event.target.value)}
                placeholder="TCH"
              />
            </Field>

            <Field
              label={t("teachers.settings.idDigits")}
              hint={t("teachers.settings.idDigitsHint")}
              id="teacher-idDigits"
            >
              <Input
                id="teacher-idDigits"
                name="teacher-idDigits"
                type="number"
                min="1"
                max="8"
                className={FORM_INPUT}
                value={settingsDraft.idDigits ?? 4}
                onChange={(event) => upd("idDigits", Number(event.target.value))}
              />
            </Field>

            <Field
              label={t("teachers.settings.idStartSeq")}
              hint={t("teachers.settings.idStartSeqHint")}
              id="teacher-idStartSeq"
            >
              <Input
                id="teacher-idStartSeq"
                name="teacher-idStartSeq"
                type="number"
                min="1"
                className={FORM_INPUT}
                value={settingsDraft.idStartSeq ?? 1}
                onChange={(event) => upd("idStartSeq", Number(event.target.value))}
              />
            </Field>
          </div>

          <ToggleRow
            label={t("teachers.settings.idRestartAnnually")}
            description={t("teachers.settings.idRestartAnnuallyDesc")}
            value={settingsDraft.idRestartAnnually ?? false}
            onChange={(value) => upd("idRestartAnnually", value)}
          />
        </div>
      </SectionCard>

      {/* General Faculty Module Configuration Card */}
      <SectionCard
        title={t("teachers.settings.title")}
        icon={SlidersHorizontal}
        accentColor="primary"
        className={SETUP_SECTION_CARD_CLASS}
      >
        <div className="space-y-4">
          <Field
            label={t("teachers.settings.defaultSpecialization")}
            id="teacher-defaultSpecialization"
          >
            <FormSelect
              id="teacher-defaultSpecialization"
              name="defaultSpecialization"
              value={settingsDraft.defaultSpecialization}
              onChange={(specialization) => upd("defaultSpecialization", specialization)}
              options={specializationOptions}
            />
          </Field>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <ToggleRow
              label={t("teachers.settings.autoGenerateId")}
              value={settingsDraft.autoGenerateId}
              onChange={(value) => upd("autoGenerateId", value)}
            />

            <ToggleRow
              label={t("teachers.settings.requireContactLink")}
              value={settingsDraft.requireContactLink}
              onChange={(value) => upd("requireContactLink", value)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export const FacultyPreferencesSection = TeachersPreferencesSection;
