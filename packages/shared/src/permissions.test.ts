import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./permissions.js";

describe("roleHasPermission", () => {
  it("grants admin full settings write", () => {
    expect(roleHasPermission("admin", "settings.branding.write")).toBe(true);
    expect(roleHasPermission("admin", "users.manage")).toBe(true);
  });

  it("denies teacher access to administrative and financial modules", () => {
    expect(roleHasPermission("teacher", "users.manage")).toBe(false);
    expect(roleHasPermission("teacher", "configuration.view")).toBe(false);
    expect(roleHasPermission("teacher", "finance.write")).toBe(false);
    expect(roleHasPermission("teacher", "contacts.read")).toBe(false);
    expect(roleHasPermission("teacher", "contacts.write")).toBe(false);
    expect(roleHasPermission("assistant_teacher", "contacts.read")).toBe(false);
    expect(roleHasPermission("teacher", "students.write")).toBe(true);
  });

  it("grants accountant finance write", () => {
    expect(roleHasPermission("accountant", "finance.write")).toBe(true);
    expect(roleHasPermission("accountant", "settings.branding.write")).toBe(false);
  });

  it("denies accountant enrollments.write", () => {
    expect(roleHasPermission("accountant", "enrollments.write")).toBe(false);
  });

  it("grants teacher enrollments.write", () => {
    expect(roleHasPermission("teacher", "enrollments.write")).toBe(true);
  });

  it("grants dedicated messaging permissions by role", () => {
    expect(roleHasPermission("admin", "messaging.clearLogs")).toBe(true);
    expect(roleHasPermission("teacher", "messaging.write")).toBe(true);
    expect(roleHasPermission("teacher", "messaging.clearLogs")).toBe(false);
    expect(roleHasPermission("accountant", "messaging.read")).toBe(true);
    expect(roleHasPermission("accountant", "messaging.write")).toBe(false);
  });

  it("grants dedicated hasanat permissions by role", () => {
    expect(roleHasPermission("admin", "hasanat.write")).toBe(true);
    expect(roleHasPermission("teacher", "hasanat.write")).toBe(true);
    expect(roleHasPermission("teacher", "hasanat.read")).toBe(true);
    expect(roleHasPermission("accountant", "hasanat.read")).toBe(false);
    expect(roleHasPermission("accountant", "hasanat.write")).toBe(false);
    expect(roleHasPermission("assistant_teacher", "hasanat.read")).toBe(true);
    expect(roleHasPermission("assistant_teacher", "hasanat.write")).toBe(false);
  });
});
