import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TeacherAssignedClassItem } from "@/lib/teachers/teacherAssignment";
import { TeacherDetailSessionsSection } from "./TeacherDetailSessionsSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params?.count !== undefined) return `${key}:${params.count}`;
      if (params?.room) return `Room ${params.room}`;
      return key;
    },
  }),
}));

const mockAssignedClass: TeacherAssignedClassItem = {
  sessionId: "ses-1",
  sessionName: "Quran Hifz Morning",
  sessionType: "academic",
  sessionStatus: "active",
  classId: "cls-1",
  className: "Tajweed Advanced",
  room: "101",
  enrolled: 15,
  capacity: 20,
};

describe("TeacherDetailSessionsSection Component", () => {
  it("renders assigned class card with room and enrollment count", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailSessionsSection assignedClasses={[mockAssignedClass]} />,
    );

    expect(html).toContain("Tajweed Advanced");
    expect(html).toContain("Quran Hifz Morning");
    expect(html).toContain("Room 101");
  });

  it("renders empty state when assignedClasses is empty", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailSessionsSection assignedClasses={[]} />,
    );

    expect(html).toContain("teachers.detail.noAssignedClasses");
  });

  it("renders error state when error is true", () => {
    const html = renderToStaticMarkup(
      <TeacherDetailSessionsSection assignedClasses={[]} error={true} />,
    );

    expect(html).toContain("teachers.loadFailed");
  });
});
