import { relations } from "drizzle-orm";
import { workspaces } from "../platform.js";
import { contacts } from "../contacts.js";
import { messageTemplates, messageLogs } from "../messaging.js";
import { dashboardPreferences, dashboardWidgets } from "../dashboard.js";

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageTemplates.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const messageLogsRelations = relations(messageLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageLogs.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [messageLogs.workspaceSubdomain, messageLogs.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const dashboardPreferencesRelations = relations(dashboardPreferences, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [dashboardPreferences.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [dashboardWidgets.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));
