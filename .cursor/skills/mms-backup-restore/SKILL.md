---
name: mms-backup-restore
description: Implements or audits workspace encrypted backup/export and wipe-restore — safety backup, validate-before-wipe, KDF/envelope, sync timeout rollback. Use when changing BackupRestore UI, /api/db/backup or /api/db/sync, backup crypto, or restore safety gates.
---

# MMS Backup & Restore Workflow

**Rules (norms SSOT):** `mms-settings-i18n.mdc` (two-step UI) · `mms-data-layer.mdc` (envelope/KDF/sync) · `mms-auth-security.mdc` (admin + `canBulkSync`).

Do **not** use for Postgres ops dumps → `mms-ops-deploy` / production scripts. Do **not** use for general settings/i18n → `mms-settings-i18n`. Do **not** use for collection sync primary path → `mms-data-sync`.

## Workflow

1. Confirm route gates: admin + `canBulkSync` on `/api/db/backup` and `/api/db/sync`.
2. **Export**: server snapshot → workspace envelope → AES-GCM (`encryptWorkspaceBackup`). Disable download when local history is metadata-only (`!backup.data`).
3. **Restore step 1**: current-password step-up + mandatory safety backup (`createSafetyBackup` → `safetyReady`).
4. Early-reject encrypted file `subdomain` ≠ current tenant (`backup.workspaceMismatch`) before decrypt prompt.
5. Run `validateWorkspaceBackupJson` / `validateAndNormalizeSnapshot` (dry-run) **before** wipe — never commit a partial restore.
6. **Restore step 2**: wipe-restore under `withSyncTimeout`; abort → full rollback + `408` / `backup.syncTimeout`.
7. Strip `SERVER_ONLY_OBJECT_KEYS`; exclude credential tables from `relationalReplaceMapping`.
8. After success: clear FE collection cache by tenant prefix; keep settings/singleton objects only.
9. All UI copy via `backup.*` keys (en/ar/ur/fa). Confirm modal must not close while busy.

## Checklist

```
- [ ] No wipe without validate-before-wipe
- [ ] Two-step + safetyReady gate intact
- [ ] Same-subdomain enforced
- [ ] Timeout rolls back (no partial commit)
- [ ] Secrets/credentials stripped from snapshot
- [ ] No dual-write restore from browser cache alone
```

## Done

Allow+deny / auth path sanity; UI two-step still gated — `mms-completion-review.mdc`.
