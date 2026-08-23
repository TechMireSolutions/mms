import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BulkActionDock,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
} from "@/components/common/BulkActionDock";

describe("BulkActionDock", () => {
  it("renders bulk selection count and actions", () => {
    const html = renderToStaticMarkup(
      <BulkActionDock
        selectedCount={5}
        countLabel="5 students selected"
        onClearSelection={() => {}}
        clearLabel="Deselect all"
      >
        <BulkSelectionDeleteAction label="Delete selected" onClick={() => {}} />
        <BulkSelectionRestoreAction label="Restore selected" onClick={() => {}} />
      </BulkActionDock>
    );

    expect(html).toContain("5 students selected");
    expect(html).toContain("Deselect all");
    expect(html).toContain("Delete selected");
    expect(html).toContain("Restore selected");
  });
});
