import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactDetailTimeline } from "./ContactDetailTimeline";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ContactDetailTimeline Component", () => {
  it("renders timeline note input and activities list", () => {
    const html = renderToStaticMarkup(
      <ContactDetailTimeline
        activities={[
          {
            id: "act-1",
            type: "note",
            content: "Called contact regarding admission",
            date: "2024-01-01T00:00:00Z",
            by: "Admin",
          },
        ]}
        noteText=""
        noteInputId="note-id"
        canPersistContact={true}
        onNoteTextChange={vi.fn()}
        onAddNote={vi.fn()}
      />,
    );

    expect(html).toContain("Called contact regarding admission");
    expect(html).toContain("Admin");
  });
});
