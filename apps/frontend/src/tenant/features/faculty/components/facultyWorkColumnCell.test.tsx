import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Teacher } from "@mms/shared";
import { renderTeacherWorkColumnValue } from "./facultyWorkColumnCell";

const mockTranslate = ((key: string) => key) as never;

const mockTeacher: Teacher = {
  id: "tch-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  specialization: "Tajweed",
  qualification: "Alimiyyah",
  joinDate: "2023-05-15",
  notes: "Senior Quran teacher",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const baseOptions = {
  t: mockTranslate,
  statusConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  emptyFallback: "—",
};

describe("renderTeacherWorkColumnValue", () => {
  it("renders status badge for status column", () => {
    const result = renderTeacherWorkColumnValue(mockTeacher, "status", baseOptions);
    const html = renderToStaticMarkup(<div>{result}</div>);

    expect(html).toContain("Active");
  });

  it("renders specialization text", () => {
    const result = renderTeacherWorkColumnValue(mockTeacher, "specialization", baseOptions);

    expect(result).toBe("Tajweed");
  });

  it("renders qualification text", () => {
    const result = renderTeacherWorkColumnValue(mockTeacher, "qualification", baseOptions);

    expect(result).toBe("Alimiyyah");
  });

  it("renders designation with semantic badge styling", () => {
    const teacherWithDesignation: Teacher = {
      ...mockTeacher,
      designation: "Head of Quranic Studies",
    };
    const result = renderTeacherWorkColumnValue(teacherWithDesignation, "designation", baseOptions);
    const html = renderToStaticMarkup(<div>{result}</div>);

    expect(html).toContain("Head of Quranic Studies");
    expect(html).toContain("bg-primary/10 text-primary");
  });

  it("renders reportingFacultyName and subordinateCount", () => {
    const facultyWithHierarchy: Teacher = {
      ...mockTeacher,
      reportingFacultyName: "Dean Ahmad",
      subordinateCount: 3,
    };
    const supervisorResult = renderTeacherWorkColumnValue(facultyWithHierarchy, "reportingFacultyName", baseOptions);
    const supervisorHtml = renderToStaticMarkup(<div>{supervisorResult}</div>);
    expect(supervisorHtml).toContain("Dean Ahmad");

    const subResult = renderTeacherWorkColumnValue(facultyWithHierarchy, "subordinateCount", baseOptions);
    const subHtml = renderToStaticMarkup(<div>{subResult}</div>);
    expect(subHtml).toContain("3");
  });

  it("returns emptyFallback for empty values", () => {
    const emptyTeacher: Teacher = {
      ...mockTeacher,
      specialization: undefined,
      designation: undefined,
      notes: undefined,
    };
    const result = renderTeacherWorkColumnValue(emptyTeacher, "designation", baseOptions);

    expect(result).toBe("—");
  });

  it("renders custom field value when customFieldsById is provided", () => {
    const customTeacher = {
      ...mockTeacher,
      room: "Room 101",
    } as unknown as Teacher;
    const customFieldsById = new Map([
      ["room", { id: "room", label: "Classroom" }],
    ]);
    const result = renderTeacherWorkColumnValue(customTeacher, "custom:room", {
      ...baseOptions,
      customFieldsById,
    });

    expect(result).toBe("Room 101");
  });
});
