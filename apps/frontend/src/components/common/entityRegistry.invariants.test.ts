import { describe, it, expect } from "vitest";
import { ENTITY_REGISTRY } from "@/components/common/entityRegistry";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const ALLOWED_BADGE_CLASSES = new Set<string>(Object.values(SEMANTIC_BADGE));

describe("entity registry invariants", () => {
  it("registers every entity under its own entityType", () => {
    for (const [registryKey, descriptor] of Object.entries(ENTITY_REGISTRY)) {
      expect(descriptor.entityType).toBe(registryKey);
    }
  });

  it("descriptors have unique field keys and unique table column orders", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      const keys = descriptor.fields.map((field) => field.key);
      expect(new Set(keys).size, `${descriptor.entityType} duplicate field keys`).toBe(keys.length);
      const orders = descriptor.getTableColumns().map((column) => column.order);
      expect(new Set(orders).size, `${descriptor.entityType} duplicate table orders`).toBe(orders.length);
    }
  });

  it("badge classNames resolve only to semanticTone SSOT values", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      for (const field of descriptor.fields) {
        for (const [variant, config] of Object.entries(field.badgeVariantMap ?? {})) {
          if (config.className) {
            expect(
              ALLOWED_BADGE_CLASSES.has(config.className),
              `${descriptor.entityType}.${field.key}.${variant} uses a non-SSOT badge class`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("drawer sections never render empty", () => {
    for (const descriptor of Object.values(ENTITY_REGISTRY)) {
      for (const section of descriptor.getDrawerSections()) {
        expect(section.fields.length, `${descriptor.entityType} section ${section.id} is empty`).toBeGreaterThan(0);
      }
    }
  });
});
