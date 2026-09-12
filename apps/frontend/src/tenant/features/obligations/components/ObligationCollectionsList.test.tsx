import React, { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { ObligationCollectionsList } from "./ObligationCollectionsList";
import type { ObligationCollection, ObligationType, MujtahidRep, Mujtahid } from "@/lib/data/obligationsData";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useWorkDirectoryViewMode", () => ({
  useWorkDirectoryViewMode: () => ({
    viewMode: "table",
    setViewMode: vi.fn(),
  }),
}));

vi.mock("@/tenant/features/obligations/hooks/useObligationLookups", () => ({
  useMergedObligationContacts: () => [],
}));

vi.mock("@/tenant/features/obligations/components/ObligationCollectionsListFilters", () => ({
  ObligationCollectionsListFilters: () => <div data-testid="filters" />,
}));

vi.mock("@/tenant/features/obligations/components/ObligationsBulkActionBar", () => ({
  ObligationsBulkActionBar: () => <div data-testid="bulk-bar" />,
}));

vi.mock("@/tenant/features/obligations/components/ObligationCollectionsListContent", () => ({
  ObligationCollectionsListContent: () => <div data-testid="content" />,
}));

const mockCollections: ObligationCollection[] = [
  {
    id: "col-1",
    receipt_no: "REC-001",
    received_date: "2025-01-01",
    sender_id: "c-1",
    amount: 100,
    currency_id: "USD",
    payment_mode: "Cash",
    obligation_type_id: "ot-1",
    mujtahid_representative_id: "rep-1",
    received_by: "u-1",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const mockObligationTypes: ObligationType[] = [
  {
    id: "ot-1",
    name: "Khums",
    quantity_based: false,
    designated_for: "Both",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const mockReps: MujtahidRep[] = [];
const mockMujtahids: Mujtahid[] = [];

describe("ObligationCollectionsList Component", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      if (container) {
        container.remove();
        container = null;
      }
    };
  });

  it("mounts and renders without exceeding maximum update depth", async () => {
    const onFilteredCountChange = vi.fn();
    const root = createRoot(container!);

    await act(async () => {
      root.render(
        <ObligationCollectionsList
          collections={mockCollections}
          obligationTypes={mockObligationTypes}
          reps={mockReps}
          mujtahids={mockMujtahids}
          onAddNew={vi.fn()}
          onView={vi.fn()}
          onFilteredCountChange={onFilteredCountChange}
          canWrite={true}
          canDelete={true}
          showDeleted={false}
          onToggleShowDeleted={vi.fn()}
          onDelete={vi.fn()}
          onRestore={vi.fn()}
          onBulkDelete={vi.fn()}
          onBulkRestore={vi.fn()}
        />,
      );
    });

    expect(container?.querySelector('[data-testid="filters"]')).not.toBeNull();
    expect(onFilteredCountChange).toHaveBeenCalledWith(1);

    // Re-render with showDeleted toggled to true (must not loop)
    await act(async () => {
      root.render(
        <ObligationCollectionsList
          collections={mockCollections}
          obligationTypes={mockObligationTypes}
          reps={mockReps}
          mujtahids={mockMujtahids}
          onAddNew={vi.fn()}
          onView={vi.fn()}
          onFilteredCountChange={onFilteredCountChange}
          canWrite={true}
          canDelete={true}
          showDeleted={true}
          onToggleShowDeleted={vi.fn()}
          onDelete={vi.fn()}
          onRestore={vi.fn()}
          onBulkDelete={vi.fn()}
          onBulkRestore={vi.fn()}
        />,
      );
    });

    expect(container?.querySelector('[data-testid="filters"]')).not.toBeNull();
  });
});
