---
name: mms-backup-restore
description: Implements or audits workspace encrypted backup/export and wipe-restore — safety backup, validate-before-wipe, KDF/envelope, sync timeout rollback. Use when changing BackupRestore UI, /api/db/backup or /api/db/sync, backup crypto, or restore safety gates.
---

# MMS Backup & Restore Workflow

**Rules (norms SSOT):** `mms-settings-i18n.md` (two-step UI) · `mms-data-layer.md` (envelope/KDF/sync) · `mms-auth-security.md` (admin + `canBulkSync`).

Do **not** use for Postgres ops dumps → `mms-ops-deploy` / production scripts. Do **not** use for general settings/i18n → `mms-settings-i18n`. Do **not** use for collection sync primary path → `mms-data-sync`.

## Workflow

1. Confirm route gates: admin + `canBulkSync` on `/api/db/backup` and `/api/db/sync`.
2. **Export**: server snapshot → workspace envelope → AES-GCM (`encryptWorkspaceBackup`). Disable download when local history is metadata-only (`!backup.data`).
3. **Restore step 1**: current-password step-up + mandatory safety backup (`createSafetyBackup` → `safetyReady`).
4. Early-reject encrypted file `subdomain` ≠ current tenant (`backup.workspaceMismatch`) before decrypt prompt.
5. Run `validateWorkspaceBackupJson` / `validateAndNormalizeSnapshot` (dry-run) **before** wipe — never commit a partial restore.
6. **Restore step 2**: wipe-restore under `withSyncTimeout`; abort → full rollback + `408` / `backup.syncTimeout`.
7. Strip `SERVER_ONLY_OBJECT_KEYS`; exclude credential tables from `relationalReplaceMapping`.
8. **Audit Trail Preservation**: Wipe-restore must NEVER truncate or mutate historical `audit_trail_events` or break cryptographic chains. Restore operations must append an immutable audit event (`action_type = 'RESTORE'`, `tableName = 'workspace_snapshot'`). Encrypted backup exports carrying audit trails must include cryptographic chain hashes and verification status in metadata (`mms-audit-trail`).
9. After success: clear FE collection cache by tenant prefix; keep settings/singleton objects only.
10. All UI copy via `backup.*` keys (en/ar/ur/fa). Confirm modal must not close while busy.
11. **Soft-Delete Continuity & Purge Bypass**: Encrypted backup exports include soft-delete metadata columns (`deleted_at`, `deleted_by`, etc.) to preserve historical audit links. During restore step 2, the wipe-restore transaction executes `SET LOCAL app.allow_hard_purge = 'true'` to bypass the `forbid_hard_delete()` trigger when purging pre-existing rows before restoring snapshot entities (`docs/soft-delete.md` §1 & §2.5 · `mms-soft-delete`). Note: Right-to-Erasure crypto-shredding permanently renders encrypted custom fields unrecoverable even across historical backups.

## Checklist

```
- [ ] No wipe without validate-before-wipe
- [ ] Two-step + safetyReady gate intact
- [ ] Same-subdomain enforced
- [ ] Timeout rolls back (no partial commit)
- [ ] Secrets/credentials stripped from snapshot
- [ ] No dual-write restore from browser cache alone
- [ ] Audit trail preserved (no truncation) and restore operation audited
- [ ] Backup preserves soft-delete metadata; wipe-restore executes under SET LOCAL app.allow_hard_purge = 'true'
```

## Done

Allow+deny / auth path sanity; UI two-step still gated — `mms-completion-review.md`.
