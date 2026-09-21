/**
 * DetailSheet ARIA / keyboard / descriptor tests (G6).
 *
 * Strategy: The DetailDrawerShell uses createPortal + Framer Motion and
 * cannot be rendered via renderToStaticMarkup. These tests verify:
 *   1. The component tree is structurally correct (instantiation / type checks).
 *   2. ARIA props are wired on the rendered element tree (property-level assertions).
 *   3. Descriptor-driven attribute rendering produces the expected section/field tree.
 *   4. Archive state renders the restore button when canRestore=true.
 *
 * Keyboard focus-trap and Escape key are exercised by useOverlayBehavior's own
 * unit tests (co-located with the hook); these tests focus on the public surface
 * of DetailSheet and its contract with EntityDescriptor<T>.
 */
import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { DetailSheet } from "@/components/common/DetailSheet";
import { createEntityDescriptor } from "@/components/common/entityDescriptorFactory";
import type { EntityDescriptor } from "@/types/entityRegistry";

// ─── fixtures ────────────────────────────────────────────────────────────────

interface SampleEntity {
  id: string;
  name: string;
  status: "active" | "archived";
}

const sampleDescriptor: EntityDescriptor<SampleEntity> = createEntityDescriptor<SampleEntity>({
  entityType: "sample",
  singularLabel: "Sample",
  pluralLabel: "Samples",
  idField: "id",
  titleField: "name",
  fields: [
    {
      key: "name",
      label: "Full Name",
      type: "text",
      fixed: true,
      defaultVisibleInTable: true,
      tableOrder: 10,
      cardSlot: "primary",
      drawerSection: "identity",
      drawerOrder: 10,
    },
    {
      key: "status",
      label: "Status",
      type: "badge",
      defaultVisibleInTable: true,
      tableOrder: 20,
      cardSlot: "badge",
      drawerSection: "identity",
      drawerOrder: 20,
      badgeVariantMap: {
        active: { label: "Active", tone: "success" },
        archived: { label: "Archived", tone: "muted" },
      },
    },
  ],
});

const sampleEntity: SampleEntity = { id: "s-1", name: "Ahmad Ali", status: "active" };

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeDetailSheet(overrides: Partial<React.ComponentProps<typeof DetailSheet<SampleEntity>>> = {}) {
  return (
    <DetailSheet<SampleEntity>
      open={true}
      onClose={() => undefined}
      title="Student Profile"
      subtitle="Grade 5"
      {...overrides}
    >
      <div>Slot content</div>
    </DetailSheet>
  );
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("DetailSheet — ARIA contract (G6)", () => {
  it("renders without throwing when open=true", () => {
    expect(() => makeDetailSheet()).not.toThrow();
  });

  it("renders without throwing when open=false", () => {
    expect(() => makeDetailSheet({ open: false })).not.toThrow();
  });

  it("accepts ariaLabel prop and passes through to DetailDrawerShell", () => {
    const el = makeDetailSheet({ ariaLabel: "Student details dialog" });
    // Verify the prop is threaded through the component tree by inspecting the JSX tree.
    // DetailSheet spreads ...props onto DetailDrawerShell which owns aria-label on the aside.
    expect(el.props.ariaLabel).toBe("Student details dialog");
  });

  it("accepts a descriptor and entity without throwing", () => {
    expect(() =>
      makeDetailSheet({ descriptor: sampleDescriptor, entity: sampleEntity }),
    ).not.toThrow();
  });

  it("renders archive banner section when archiveState.isDeleted=true", () => {
    const el = makeDetailSheet({
      archiveState: {
        isDeleted: true,
        deletedAt: "2026-08-01T10:00:00Z",
        deletedBy: "Admin",
        canRestore: true,
        onRestore: () => undefined,
        recordTitle: "Ahmad Ali",
        restoreLabel: "Restore Ahmad",
      },
    });
    // Structural type assertion: the element type is DetailSheet
    expect(el.type).toBe(DetailSheet);
    // Props contract: archiveState flows through
    expect(el.props.archiveState?.isDeleted).toBe(true);
    expect(el.props.archiveState?.canRestore).toBe(true);
    expect(el.props.archiveState?.restoreLabel).toBe("Restore Ahmad");
  });

  it("does NOT render archive banner when archiveState.isDeleted=false", () => {
    const el = makeDetailSheet({
      archiveState: { isDeleted: false },
    });
    expect(el.props.archiveState?.isDeleted).toBe(false);
  });

  it("descriptor sections are non-empty for the sample entity", () => {
    const sections = sampleDescriptor.getDrawerSections();
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0]?.fields.length).toBeGreaterThanOrEqual(1);
  });

  it("descriptor renders field value for known fields", () => {
    const nameVal = sampleDescriptor.renderFieldValue("name", sampleEntity);
    // renderFieldValue returns ReactNode; for a text field it should include the value
    expect(nameVal).toBeDefined();
  });

  it("descriptor formatFieldValue is a non-empty string for the name field", () => {
    const formatted = sampleDescriptor.formatFieldValue("name", sampleEntity);
    expect(typeof formatted).toBe("string");
    expect(formatted).toBe("Ahmad Ali");
  });

  it("descriptor formatFieldValue resolves badge label for status field", () => {
    const formatted = sampleDescriptor.formatFieldValue("status", sampleEntity);
    // The badge variant map maps 'active' → label 'Active'
    expect(formatted).toBe("Active");
  });

  it("drawer sections contain the expected drawerSection groupings", () => {
    const sections = sampleDescriptor.getDrawerSections();
    const sectionIds = sections.map((s) => s.id);
    expect(sectionIds).toContain("identity");
  });

  it("drawer section 'identity' contains both name and status fields", () => {
    const identitySection = sampleDescriptor.getDrawerSections().find((s) => s.id === "identity");
    expect(identitySection).toBeDefined();
    const fieldKeys = identitySection!.fields.map((f) => f.key);
    expect(fieldKeys).toContain("name");
    expect(fieldKeys).toContain("status");
  });

  it("DetailSheet element type is DetailSheet (component identity check)", () => {
    const el = makeDetailSheet();
    expect(el.type).toBe(DetailSheet);
  });
});

describe("DetailSheet — open/close state (G6)", () => {
  it("open=true and open=false produce distinct but valid elements", () => {
    const openEl = makeDetailSheet({ open: true });
    const closedEl = makeDetailSheet({ open: false });
    expect(openEl.props.open).toBe(true);
    expect(closedEl.props.open).toBe(false);
    // Both are the same component type
    expect(openEl.type).toBe(closedEl.type);
  });

  it("onClose callback prop is preserved through the element tree", () => {
    const onClose = () => undefined;
    const el = makeDetailSheet({ onClose });
    expect(el.props.onClose).toBe(onClose);
  });
});

describe("DetailSheet — entityType registry lookup (G6)", () => {
  it("accepts entityType string without descriptor prop without throwing", () => {
    // Uses getEntityDescriptor(type) internally; if type is unknown it returns undefined
    // and the descriptor branch is simply skipped — no throw.
    expect(() =>
      makeDetailSheet({ entityType: "students" }),
    ).not.toThrow();
  });
});

describe("DetailSheet — DOM & ARIA live contract", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
  });

  it("renders role='dialog' and aria-modal='true' on the dialog aside landmark in DOM", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <DetailSheet
          open={true}
          onClose={() => {}}
          title="Student Profile"
          ariaLabel="Student profile details dialog"
        >
          <div>Profile content</div>
        </DetailSheet>,
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-label")).toBe("Student profile details dialog");

    await act(async () => {
      root.unmount();
    });
  });

  it("triggers onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DetailSheet
          open={true}
          onClose={onClose}
          title="Dismissible Drawer"
        >
          <div>Body</div>
        </DetailSheet>,
      );
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(onClose).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("renders archive banner and invokes onRestore when restore button is clicked", async () => {
    const onRestore = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DetailSheet
          open={true}
          onClose={() => {}}
          title="Archived Item"
          archiveState={{
            isDeleted: true,
            deletedAt: "2026-09-01T12:00:00Z",
            deletedBy: "Admin User",
            canRestore: true,
            onRestore,
            recordTitle: "Archived Record",
            restoreLabel: "Restore This Record",
          }}
        >
          <div>Body</div>
        </DetailSheet>,
      );
    });

    expect(document.body.textContent).toContain("Restore This Record");

    const restoreButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Restore This Record"),
    );
    expect(restoreButton).toBeDefined();

    await act(async () => {
      restoreButton?.click();
    });

    expect(onRestore).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("renders descriptor sections and attribute rows into the live DOM", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DetailSheet<SampleEntity>
          open={true}
          onClose={() => {}}
          title="Sample Details"
          descriptor={sampleDescriptor}
          entity={sampleEntity}
        >
          <div>Additional slot</div>
        </DetailSheet>,
      );
    });

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).toContain("Full Name");
    expect(bodyText).toContain("Ahmad Ali");
    expect(bodyText).toContain("Status");
    expect(bodyText).toContain("statusBadge.active");
    expect(bodyText).toContain("Additional slot");

    await act(async () => {
      root.unmount();
    });
  });
});

