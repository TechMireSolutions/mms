import React from "react";
import type { PlatformWorkspaceRow, PlatformUserProfile, PlatformSettings } from "@mms/shared";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { createEntityDescriptor } from "../entityDescriptorFactory";

export const platformWorkspacesEntityDescriptor: EntityDescriptor<PlatformWorkspaceRow> =
  createEntityDescriptor<PlatformWorkspaceRow>({
    entityType: "platformWorkspaces",
    singularLabel: "Workspace",
    pluralLabel: "Workspaces",
    idField: "subdomain",
    titleField: "madrasaName",
    fields: [
      {
        key: "madrasaName",
        label: "Madrasa Name",
        type: "text",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 10,
        fixed: true,
        cardSlot: "primary",
        drawerSection: "general",
        drawerOrder: 10,
      },
      {
        key: "subdomain",
        label: "Subdomain",
        type: "text",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 20,
        cardSlot: "secondary",
        drawerSection: "general",
        drawerOrder: 20,
      },
      {
        key: "enabled",
        label: "Active Status",
        type: "badge",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 30,
        cardSlot: "badge",
        drawerSection: "status",
        drawerOrder: 30,
        renderValue: (ws) => (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-md border text-xs px-2 py-0.5 ${
              ws.enabled ? SEMANTIC_BADGE.success : SEMANTIC_BADGE.muted
            }`}
          >
            {ws.enabled ? "Active" : "Disabled"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created Date",
        type: "date",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 40,
        cardSlot: "meta",
        drawerSection: "general",
        drawerOrder: 40,
      },
    ],
  });

export const platformUsersEntityDescriptor: EntityDescriptor<PlatformUserProfile> =
  createEntityDescriptor<PlatformUserProfile>({
    entityType: "platformUsers",
    singularLabel: "Platform Admin",
    pluralLabel: "Platform Admins",
    idField: "id",
    titleField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 10,
        fixed: true,
        cardSlot: "primary",
        drawerSection: "identity",
        drawerOrder: 10,
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 20,
        cardSlot: "secondary",
        drawerSection: "identity",
        drawerOrder: 20,
      },
      {
        key: "role",
        label: "Role",
        type: "badge",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 30,
        cardSlot: "badge",
        drawerSection: "access",
        drawerOrder: 30,
        badgeVariantMap: {
          super_user: { label: "Super User", tone: "primary", className: SEMANTIC_BADGE.primary },
          admin: { label: "Admin", tone: "info", className: SEMANTIC_BADGE.info },
        },
      },
      {
        key: "disabledAt",
        label: "Status",
        type: "badge",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 40,
        cardSlot: "badge",
        drawerSection: "access",
        drawerOrder: 40,
        renderValue: (u) => (
          <span
            className={`inline-flex items-center gap-1 font-bold rounded-md border text-xs px-2 py-0.5 ${
              u.disabledAt ? SEMANTIC_BADGE.destructive : SEMANTIC_BADGE.success
            }`}
          >
            {u.disabledAt ? "Disabled" : "Active"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created At",
        type: "date",
        sortable: true,
        defaultVisibleInTable: true,
        tableOrder: 50,
        cardSlot: "meta",
        drawerSection: "metadata",
        drawerOrder: 50,
      },
    ],
  });

export const platformSettingsEntityDescriptor: EntityDescriptor<PlatformSettings> =
  createEntityDescriptor<PlatformSettings>({
    entityType: "platformSettings",
    singularLabel: "Platform Setting",
    pluralLabel: "Platform Settings",
    idField: "id",
    titleField: "certbotEmail",
    fields: [
      {
        key: "certbotEmail",
        label: "Certbot Email",
        type: "email",
        defaultVisibleInTable: true,
        tableOrder: 10,
        fixed: true,
        cardSlot: "primary",
        drawerSection: "ssl",
        drawerOrder: 10,
      },
      {
        key: "syncTlsOnCreate",
        label: "Auto Sync TLS",
        type: "boolean",
        defaultVisibleInTable: true,
        tableOrder: 20,
        cardSlot: "badge",
        drawerSection: "ssl",
        drawerOrder: 20,
      },
      {
        key: "tlsExtraSans",
        label: "Extra SANs",
        type: "text",
        defaultVisibleInTable: true,
        tableOrder: 30,
        cardSlot: "secondary",
        drawerSection: "ssl",
        drawerOrder: 30,
      },
    ],
  });
