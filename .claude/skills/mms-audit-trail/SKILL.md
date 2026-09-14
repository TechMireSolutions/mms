---
name: mms-audit-trail
description: Implements or audits the database audit trail — RFC 8785 canonical JSON, sharded hash chains, crypto-shredding, monthly partitions, and outbox capture. Use when tracking entity mutations, compliance exports, or right-to-erasure events. Do NOT use for transient error logging (use Pino in mms-backend-api), soft-delete trash recovery (use mms-soft-delete), or financial invoice posting (use mms-finance-accounting).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Modern Audit Trail Workflow

**Rules (norms SSOT):** `mms-data-layer.md` §5 · `mms-auth-security.md` §5 · `mms-core.md` · `mms-performance.md`. DDL migrations → `mms-schema-migrate`.

Enterprise guidelines for immutable, tamper-evident, privacy-compliant database audit trails across tenant workspaces and platform apex.

---

## When to use

- Designing or querying audit tables (`audit_trail_events`, `audit_verification_runs`, `audit_merkle_roots`)
- Writing entity state change tracking or transactional outbox capture hooks
- Cryptographic hash verification, Merkle tree rollups, or tamper-evidence checks
- Handling Right to Erasure / GDPR compliance without breaking cryptographic hash chains
- Setting up append-only database immutability rules (`INSERT`-only) and statement auditing

---

## 1. Five-Dimension Capture Model

Every audit event must capture five dimensions stored deterministically using **RFC 8785 (JSON Canonicalization Scheme - JCS)**:

| Dimension | Columns | Invariant |
|---|---|---|
| **Who** | `real_user_id`, `impersonated_user_id`, `ip_address`, `client_app`, `session_id` | Full actor identification; distinguishes actual user from impersonator. |
| **What** | `table_name`, `record_id`, `old_state`, `new_state` | Deterministic RFC 8785 state snapshots. Minimise at capture time (strip passwords, tokens, full PII). |
| **When** | `transaction_timestamp` | UTC microsecond precision (`clock_timestamp()`). |
| **Why** | `correlation_id`, `action_type`, `api_endpoint`, `http_method` | Correlates mutation to HTTP request or background job. Action types: `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `REDACT`. |
| **Integrity** | `hash_previous`, `hash_current`, `verification_status` | Cryptographic tamper-evidence (SHA-256 chain). |

---

## 2. Capture Patterns: Transactional Outbox

MMS uses an **Application-Level Outbox** pattern:
1. Always write audit events in the **exact same database transaction** as the primary business entity mutation (`withTenant(async (tx) => { ... })`).
2. If the transaction rolls back, no orphan audit rows exist; if it commits, the audit event is atomically persisted.
3. For soft-delete operations, emit `entity.soft_deleted` and `entity.restored` with monotonic versioning (`Date.now()`) to trigger external search index eviction and cache invalidation.

---

## 3. Cryptographic Integrity & Hash Chains

### Chain Formula
```
hash_current = SHA-256(hash_previous + canonical_json(payload) + transaction_timestamp)
```
- For complete TypeScript RFC 8785 canonical JSON serializer and Merkle tree calculations, see [`references/canonical-merkle.ts`](references/canonical-merkle.ts).
- For monthly range-partitioned DDL and append-only database triggers, see [`references/audit-partitions.sql`](references/audit-partitions.sql).

---

## 4. Right to Erasure (Crypto-Shredding)

Under GDPR Article 17, personal data must be erasable without breaking the tamper-evident hash chain:
1. Store sensitive PII encrypted with a tenant- or subject-specific symmetric key (`crypto_shredding_keys`).
2. To satisfy an erasure request:
   - Destroy the decryption key (`DELETE FROM crypto_shredding_keys WHERE subject_id = :id`).
   - The encrypted ciphertext in historical `old_state`/`new_state` becomes irrecoverably unreadable (cryptographic shredding).
   - The SHA-256 hash chain remains continuous and mathematically valid.
   - Insert an audit event with `action_type = 'REDACT'` recording the erasure request.

---

## 5. Storage Tiering & Database Immutability

1. **Partitioning:** Range-partition `audit_trail_events` by month (`transaction_timestamp`).
2. **Immutability:** Apply `trg_audit_trail_immutable` `BEFORE UPDATE OR DELETE` to guarantee append-only persistence.
3. **WORM Archival:** Cold partitions (>12 months) are compressed and offloaded to immutable object storage.

---

## 6. Verification & Audit Acceptance Checklist

```bash
# Verify TypeScript type correctness across audit services
pnpm --filter @mms/backend typecheck

# Run backend inject tests for audit and entity mutations
pnpm --filter @mms/backend test:inject
```

- [ ] All audit events are written within the same transaction as entity changes.
- [ ] Direct `UPDATE` or `DELETE` on `audit_trail_events` fails with `check_violation`.
- [ ] Hash chain links verify cleanly via SHA-256 against RFC 8785 canonical JSON.
- [ ] No passwords, credentials, or raw tokens are stored in `old_state` or `new_state`.
