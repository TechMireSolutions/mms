import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RedemptionTracker } from "./RedemptionTracker";
import type { Distribution, Redemption } from "@/lib/data/hasanatData";

const mockRedemptions: Redemption[] = [
  {
    id: "red-1",
    distributionId: "dist-1",
    studentName: "Fatima Zahra",
    reward: "Islamic Storybook",
    pointsUsed: 50,
    date: "2025-04-10",
    approvedBy: "Ustadha Maryam",
  },
];

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock("@/tenant/features/hasanat/components/RedeemModal", () => ({
  RedeemModal: () => null,
}));

vi.mock("@/tenant/features/hasanat/hooks/useHasanatApi", () => ({
  useHasanatRedemptionsCollection: () => mockRedemptions,
  useHasanatMutations: () => ({
    replaceRedemptions: { mutateAsync: vi.fn() },
  }),
}));

describe("RedemptionTracker", () => {
  const baseProps = {
    distributions: [] as Distribution[],
    onUpdateDistribution: vi.fn(),
  };

  it("renders mobile card with student name, reward, and points", () => {
    const html = renderToStaticMarkup(<RedemptionTracker {...baseProps} />);

    expect(html).toContain("Fatima Zahra");
    expect(html).toContain("Islamic Storybook");
    expect(html).toContain("hasanat.form.pointsShort");
    expect(html).toContain("Ustadha Maryam");
  });

  it("renders metadata tiles for reward, date, and approver", () => {
    const html = renderToStaticMarkup(<RedemptionTracker {...baseProps} />);

    expect(html).toContain("hasanat.columns.redemption.reward");
    expect(html).toContain("hasanat.columns.redemption.date");
    expect(html).toContain("hasanat.columns.redemption.approvedBy");
  });
});
