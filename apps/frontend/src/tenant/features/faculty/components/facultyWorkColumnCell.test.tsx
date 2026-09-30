import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Faculty } from "@mms/shared";
import { renderFacultyWorkColumnValue, type RenderFacultyWorkColumnOptions } from "./facultyWorkColumnCell";

const mockTranslate = ((key: string) => key) as never;

const mockFaculty: Faculty = {
  id: "tch-1",
  contactId: "cnt-1",
  name: "Ustadh Umar",
  status: "active",
  specialization: "Tajweed",
  qualification: "Alimiyyah",
  joinDate: "2023-05-15",
  notes: "Senior Quran instructor",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const baseOptions: RenderFacultyWorkColumnOptions = {
  t: mockTranslate,
  statusConfig: { active: { label: "Active", cls: "bg-success/10 text-success" } },
  emptyFallback: "—",
};

describe("renderFacultyWorkColumnValue", () => {
  it("renders status badge for status column", () => {
    const result = renderFacultyWorkColumnValue(mockFaculty, "status", baseOptions);
    const html = renderToStaticMarkup(<div>{result}</div>);

    expect(html).toContain("Active");
  });

  it("renders specialization text", () => {
    const result = renderFacultyWorkColumnValue(mockFaculty, "specialization", baseOptions);

    expect(result).toBe("Tajweed");
  });

  it("renders qualification text", () => {
    const result = renderFacultyWorkColumnValue(mockFaculty, "qualification", baseOptions);

    expect(result).toBe("Alimiyyah");
  });

  it("renders designation with semantic badge styling", () => {
    const facultyWithDesignation: Faculty = {
      ...mockFaculty,
      designation: "Head of Quranic Studies",
    };
    const result = renderFacultyWorkColumnValue(facultyWithDesignation, "designation", baseOptions);
    const html = renderToStaticMarkup(<div>{result}</div>);

    expect(html).toContain("Head of Quranic Studies");
    expect(html).toContain("bg-primary/10 text-primary");
  });

  it("renders reportingFacultyName and subordinateCount", () => {
    const facultyWithHierarchy: Faculty = {
      ...mockFaculty,
      reportingFacultyName: "Dean Ahmad",
      subordinateCount: 3,
    };
    const supervisorResult = renderFacultyWorkColumnValue(facultyWithHierarchy, "reportingFacultyName", baseOptions);
    const supervisorHtml = renderToStaticMarkup(<div>{supervisorResult}</div>);
    expect(supervisorHtml).toContain("Dean Ahmad");

    const subResult = renderFacultyWorkColumnValue(facultyWithHierarchy, "subordinateCount", baseOptions);
    const subHtml = renderToStaticMarkup(<div>{subResult}</div>);
    expect(subHtml).toContain("3");
  });

  it("returns emptyFallback for empty values", () => {
    const emptyFaculty: Faculty = {
      ...mockFaculty,
      specialization: undefined,
      designation: undefined,
      notes: undefined,
    };
    const result = renderFacultyWorkColumnValue(emptyFaculty, "designation", baseOptions);

    expect(result).toBe("—");
  });

  it("renders custom field value when customFieldsById is provided", () => {
    const customFaculty: Faculty = {
      ...mockFaculty,
      room: "Room 101",
    };
    const customFieldsById = new Map([
      ["room", { id: "room", label: "Classroom" }],
    ]);
    const result = renderFacultyWorkColumnValue(customFaculty, "custom:room", {
      ...baseOptions,
      customFieldsById,
    });

    expect(result).toBe("Room 101");
  });
});

