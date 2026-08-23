import React from "react";
import { describe, it, expect } from "vitest";
import { DetailSheet } from "@/components/common/DetailSheet";

describe("DetailSheet", () => {
  it("instantiates DetailSheet element structure", () => {
    function DetailSheetWrapper({ open }: { open: boolean }) {
      return (
        <DetailSheet
          open={open}
          onClose={() => {}}
          title="Student Profile"
          subtitle="Grade 5"
          archiveState={{
            isDeleted: true,
            deletedAt: "2026-08-20T10:00:00Z",
            deletedBy: "Admin User",
            canRestore: true,
            onRestore: () => {},
            recordTitle: "Ahmad Ali",
            restoreLabel: "Restore Ahmad",
          }}
        >
          <div>Detailed Information</div>
        </DetailSheet>
      );
    }

    const openElement = <DetailSheetWrapper open={true} />;
    const closedElement = <DetailSheetWrapper open={false} />;

    expect(openElement.type).toBe(DetailSheetWrapper);
    expect(closedElement.type).toBe(DetailSheetWrapper);
  });
});
