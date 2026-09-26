---
name: mms-module-setup
description: Implements or modifies the module Setup tier per mms-module-architecture.mdc — the Preferences/setup shell, sub-tab registration, setup audit, and preference cascading. Use when configuring module settings, setup sub-tabs, or module preferences. Do NOT use for the field registry and Setup → Fields field definitions (use mms-fields-registry), global workspace settings under /settings (use mms-settings-i18n), or Work tier tables/drawers (use mms-module-work).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Module Setup Workflow

**Rules (norms SSOT):** `mms-module-architecture.mdc` §4 · `mms-fields.mdc` · `mms-settings-i18n.mdc`. Field definitions → `mms-fields-registry`.

Operational guide for configuring the module Setup tier, sub-tabs, and Preferences panels.

## 1. Setup Tier Architecture & Sub-Tabs

- **Tier Structure**: Module Setup (`tierId: 'setup'`) houses Preferences and manifest-declared `setupSubTabs` (e.g. `['preferences', 'fields']`).
- **Shell Standard**: Render via `SubTabBar` + `useModuleSetupSubTabs` (`apps/frontend/src/lib/setup/useModuleSetupSubTabs.ts`), which manages sub-tab switching, dirty-state tracking, and discard confirmations.
- **RBAC Gating**: Gate edit capabilities with `canEditSetup`. Render `SetupReadOnlyMessage` when the user has view-only access.
- **Isolation**: Module-specific preferences belong exclusively in the module's Setup tab. Never place module setup panels under global `/settings`.

## 2. Preferences & Drafting Standard

- **In-Memory Drafts**: Preferences draft locally in component state (`useSettingsDraft`). Auto-saving on field changes is strictly banned.
- **Explicit Save**: The Save CTA is dirty-gated and commits changes via typed REST (`saveSettingsAsync`). Await mutations before indicating success.
- **Setup Audit**: Mutating module configuration logs a setup audit event (`POST /api/{module}/setup-audit`).

## 3. Custom Field Lifecycle & Visibility Cascade

- **Deactivation Over Erasure**: Prefer deactivating or hiding custom fields in registry state to preserve historical reporting data.
- **Delete Guard**: Before removing custom fields, execute dependency checking (`get*FieldRemovalIssues()` from `@mms/shared`) to block deletion if values exist.
- **Visibility Cascade**: Disabling a field must remove it from:
  1. Create/edit form controls
  2. Detail drawer read rows
  3. Work directory table columns and card tiles
  4. Search/filter dropdown dimensions
  5. CustomReportBuilder and export columns
