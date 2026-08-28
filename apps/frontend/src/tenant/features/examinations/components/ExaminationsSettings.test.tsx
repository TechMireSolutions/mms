import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationsSettings } from "./ExaminationsSettings";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useStandardModuleConfig", () => ({
  useExaminationConfig: () => ({
    settings: {
      gradingSystem: "percentage",
      certificateTemplate: "default",
      passMark: "50",
      maxMark: "100",
      showRankings: true,
      allowRetake: false,
      autoPublishResults: true,
      notifyOnResult: false,
      aiGrading: false,
      distinguishHonours: false,
      examReminders: true,
    },
  }),
}));

vi.mock("@/tenant/hooks/useModuleSettingsEditor", () => ({
  useModuleSettingsEditor: () => ({
    settingsDraft: {
      gradingSystem: "percentage",
      certificateTemplate: "default",
      passMark: "50",
      maxMark: "100",
      showRankings: true,
      allowRetake: false,
      autoPublishResults: true,
      notifyOnResult: false,
      aiGrading: false,
      distinguishHonours: false,
      examReminders: true,
    },
    saved: false,
    upd: vi.fn(),
    saveSettingsAsync: vi.fn(),
  }),
}));

vi.mock("@/components/ui/SectionCard", () => ({
  SectionCard: ({ children, title }: any) => (
    <div data-testid="section-card">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/ToggleRow", () => ({
  ToggleRow: ({ label }: any) => <div data-testid="toggle-row">{label}</div>,
}));

vi.mock("@/components/ui/FormSelect", () => ({
  FormSelect: ({ options, value }: any) => (
    <select data-testid="form-select" defaultValue={value}>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

describe("ExaminationsSettings Component", () => {
  it("renders preferences form and toggle rows", () => {
    const html = renderToStaticMarkup(<ExaminationsSettings />);
    expect(html).toContain("examinations.settings.titlePreferences");
    expect(html).toContain("examinations.settings.gradingSystem");
    expect(html).toContain("examinations.settings.showRankings");
  });
});
