import { describe, expect, it } from "vitest";
import { DASHBOARD_PREFERENCES_KEY, INVOICE_TEMPLATE_OBJECT_KEY, type User } from "@mms/shared";
import {
  canBulkSync,
  canDeleteContacts,
  canReadCollection,
  canReadContacts,
  canReadObject,
  canResetTenantData,
  canWriteCollection,
  canWriteContacts,
  canWriteObject,
} from "../services/rbacService.js";

const admin: User = { id: "1", email: "a@test.com", name: "Admin", role: "admin", workspaceSubdomain: "demo" };
const teacher: User = { id: "2", email: "t@test.com", name: "Teacher", role: "teacher", workspaceSubdomain: "demo" };
const accountant: User = { id: "3", email: "c@test.com", name: "Acct", role: "accountant", workspaceSubdomain: "demo" };

const viewer: User = { id: "4", email: "v@test.com", name: "Viewer", role: "viewer", workspaceSubdomain: "demo" };

describe("rbacService", () => {
  it("restricts users collection to admin", () => {
    expect(canWriteCollection(admin, "users")).toBe(true);
    expect(canWriteCollection(teacher, "users")).toBe(false);
  });

  it("restricts backups and user_activity_logs to admin only for read and write", () => {
    // Backups (Admin only)
    expect(canReadCollection(admin, "backups")).toBe(true);
    expect(canReadCollection(teacher, "backups")).toBe(false);
    expect(canReadCollection(accountant, "backups")).toBe(false);
    expect(canReadCollection(viewer, "backups")).toBe(false);
    expect(canWriteCollection(admin, "backups")).toBe(true);
    expect(canWriteCollection(teacher, "backups")).toBe(false);
    expect(canWriteCollection(accountant, "backups")).toBe(false);
    expect(canWriteCollection(viewer, "backups")).toBe(false);

    // User Activity Logs (Requires analytics.view permission, viewer denied)
    expect(canReadCollection(admin, "user_activity_logs")).toBe(true);
    expect(canReadCollection(teacher, "user_activity_logs")).toBe(true);
    expect(canReadCollection(viewer, "user_activity_logs")).toBe(false);
    expect(canWriteCollection(admin, "user_activity_logs")).toBe(true);
    expect(canWriteCollection(teacher, "user_activity_logs")).toBe(true);
    expect(canWriteCollection(viewer, "user_activity_logs")).toBe(false);
  });

  it("allows write roles on general collections if role has permission", () => {
    expect(canWriteCollection(teacher, "students")).toBe(true);
    expect(canWriteCollection(accountant, "students")).toBe(false);
    expect(canWriteCollection(accountant, "finance_invoices")).toBe(true);
  });

  it("denies unknown collection and object keys by default", () => {
    expect(canReadCollection(admin, "tenant_escape")).toBe(false);
    expect(canWriteCollection(admin, "tenant_escape")).toBe(false);
    expect(canReadObject(admin, "tenant_escape")).toBe(false);
    expect(canWriteObject(admin, "tenant_escape")).toBe(false);
  });

  it("allows staff persistence for frontend dashboard and invoice configuration objects", () => {
    for (const key of [DASHBOARD_PREFERENCES_KEY, INVOICE_TEMPLATE_OBJECT_KEY]) {
      expect(canReadObject(admin, key)).toBe(true);
      expect(canWriteObject(admin, key)).toBe(true);
      expect(canReadObject(teacher, key)).toBe(true);
      expect(canWriteObject(teacher, key)).toBe(true);
      expect(canReadObject(viewer, key)).toBe(false);
      expect(canWriteObject(viewer, key)).toBe(false);
    }
  });

  it("restricts students read to roles with students.read", () => {
    expect(canReadCollection(admin, "students")).toBe(true);
    expect(canReadCollection(teacher, "students")).toBe(true);
    expect(canReadCollection(viewer, "students")).toBe(false);
  });

  it("restricts contacts read to roles with contacts.read", () => {
    expect(canReadCollection(accountant, "contacts")).toBe(true);
    expect(canReadCollection(viewer, "contacts")).toBe(false);
  });

  it("restricts branding to admin", () => {
    expect(canWriteObject(admin, "branding")).toBe(true);
    expect(canWriteObject(accountant, "branding")).toBe(false);
  });

  it("restricts email integration to admin", () => {
    expect(canWriteObject(admin, "email_integration")).toBe(true);
    expect(canWriteObject(teacher, "email_integration")).toBe(false);
    expect(canReadObject(admin, "email_integration")).toBe(true);
    expect(canReadObject(teacher, "email_integration")).toBe(false);
  });

  it("restricts bulk sync to admin", () => {
    expect(canBulkSync(admin)).toBe(true);
    expect(canBulkSync(teacher)).toBe(false);
  });

  it("restricts tenant reset to admin", () => {
    expect(canResetTenantData(admin)).toBe(true);
    expect(canResetTenantData(teacher)).toBe(false);
  });

  it("aligns contacts write with contacts.write permission", () => {
    expect(canWriteContacts(admin)).toBe(true);
    expect(canWriteContacts(teacher)).toBe(true);
    expect(canWriteContacts(accountant)).toBe(false);
    expect(canWriteContacts(viewer)).toBe(false);
  });

  it("aligns contacts delete with contacts.delete permission", () => {
    expect(canDeleteContacts(admin)).toBe(true);
    expect(canDeleteContacts(teacher)).toBe(false);
    expect(canDeleteContacts(accountant)).toBe(false);
  });

  it("aligns contacts read with contacts.read permission", () => {
    expect(canReadContacts(admin)).toBe(true);
    expect(canReadContacts(teacher)).toBe(true);
    expect(canReadContacts(accountant)).toBe(true);
    expect(canReadContacts(viewer)).toBe(false);
  });
});
