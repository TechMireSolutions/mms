---
name: mms-audit-trail
description: Implements, verifies, or audits database audit trails — RFC 8785 canonical JSON payloads, transactional outbox capture, sharded cryptographic hash chains, Merkle tree rollups, crypto-shredding, right-to-erasure workflows, monthly date partitioning, INSERT-only privilege hardening, and pgAudit pairing. Use when designing audit tables, implementing state change tracking, verifying chain integrity, handling erasure/GDPR compliance, or exporting tamper-evident audit reports.
---

# MMS Modern Audit Trail Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` §5 · `mms-auth-security.mdc` §5 · `mms-core.mdc` · `mms-performance.mdc`. DDL migrations → `mms-schema-migrate`.

Enterprise guidelines for immutable, tamper-evident, privacy-compliant database audit trails across tenant workspaces and platform apex.

---

## When to use

- Designing or querying audit tables (`audit_trail_events`, `audit_verification_runs`, `audit_merkle_roots`, `crypto_shredding_keys`, `audit_erasure_requests`)
- Writing entity state change tracking or outbox capture hooks
- Cryptographic hash verification, Merkle tree rollups, or tamper-evidence checks
- Handling Right to Erasure / GDPR compliance without breaking cryptographic chains
- Setting up database permissions (`INSERT`-only) and `pgAudit` statement auditing
- Implementing tiered storage (Hot monthly partitions, Warm, Cold WORM object storage)
- Generating tamper-evident compliance exports and anomaly detection baselines

---

## 1. Five-Dimension Payload Standard & Canonical JSON

Capture five dimensions per state-change event. Store row states as canonical JSON so hashing and comparison are deterministic across languages and services — use **RFC 8785 (JSON Canonicalization Scheme - JCS)** rather than an ad-hoc "sort keys, strip whitespace" convention, so canonicalisation is interoperable across your stack.

| Dimension | Required Fields (DTO / DB Column) | Invariant & Purpose |
|---|---|---|
| **Who** | `realUserId` (`real_user_id`), `impersonatedUserId` (`impersonated_user_id`), `ipAddress` (`ip_address`), `clientApp` (`client_app`), `sessionId` (`session_id`) | Identifies human/service actor, explicit impersonation context, client application, IP address, and session token trace. |
| **What** | `tableName` (`table_name`), `recordId` (`record_id`), `oldState` (`old_state`), `newState` (`new_state`) | Exact point-in-time state reconstruction stored as RFC 8785 canonical JSON. Strip fields not needed for reconstruction. |
| **When** | `transactionTimestamp` (`transaction_timestamp`) | UTC, microsecond precision `TIMESTAMPTZ` (`clock_timestamp()`) for timeline accuracy under concurrent writes. |
| **Why** | `correlationId` (`correlation_id` / W3C `traceparent`), `actionType` (`action_type`), `apiEndpoint` (`api_endpoint`), `httpMethod` (`http_method`) | Correlates DB mutation back to HTTP request, user action, or background job. Action types: `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `LOGIN`, `REDACT`, `RESTORE`. |
| **Integrity** | `hashPrevious` (`hash_previous`), `hashCurrent` (`hash_current`), `verificationStatus` (`verification_status`) | Cryptographic tamper-evidence (SHA-256 chain). |

### Minimization Invariant
**Minimise at capture time.** Don't log full PII payloads into `old_state`/`new_state` if the field isn't needed for reconstruction — every field captured is a field you must later handle under an erasure request. Strip raw passwords, OTPs, session cookies, payment card numbers, and OAuth refresh tokens completely.

---

## 2. Capture Patterns: Outbox, CDC & Event Sourcing Trade-Offs

| Pattern | Best for | Overhead | Consistency |
|---|---|---|---|
| **Application-level Outbox** | New services / MMS default; strong consistency required | Low (writes inside the existing transaction) | Strong |
| **Change Data Capture (CDC)** | High-throughput systems where you can't touch application code | Near-zero on the primary; async downstream | Eventual |
| **Hybrid (CDC + Outbox)** | Large systems with mixed workloads | Variable | Configurable |
| **Event Sourcing** | Domains where the event log *is* the system of record | None — it's the primary architecture | Strong |

```
Fastify Route Handler
   │
   ▼
withTenantTransaction(async (tx) => {
   1. Mutate Business Entity (e.g. students, invoices, contacts)
   2. Compute Delta (oldState, newState) via RFC 8785
   3. Insert Audit Event in Outbox / Audit Table (same tx)
})
```

- **Application-Level Outbox:** Default for MMS. Write audit records in the exact same database transaction as the primary entity mutation. If the transaction rolls back, no orphan audit rows exist; if it commits, the audit record is atomically persisted.
- **W3C Trace Context Propagation:** Use a real trace ID for `correlation_id`, not a bespoke UUID. Propagate the W3C Trace Context `traceparent` value as (or alongside) the correlation ID. This lets audit rows be correlated directly with your observability/tracing stack instead of maintaining a parallel, audit-only identifier.
- **CDC (Change Data Capture):** Reserved for high-throughput streaming pipelines where eventual consistency is acceptable (e.g. Debezium reading WAL into Kafka/broker).
- **Event Sourcing Ban for Pure Audit:** Don't reach for Event Sourcing purely for audit purposes — it's an architectural commitment across the entire domain, not an audit feature; adopt it only if your domain already benefits from an event-sourced model for reasons beyond auditing.

---

## 3. Cryptographic Integrity & Sharded Chains

### Chain Construction Formula
```
hash_current = SHA-256(hash_previous + canonical_json(payload) + transaction_timestamp)
```

Implementation pattern utilizing native Node.js 24 crypto:
```ts
import crypto from 'node:crypto';

/**
 * Computes deterministic SHA-256 hash using RFC 8785 canonical JSON.
 */
export function computeAuditEventHash(
  hashPrevious: string,
  canonicalPayloadJson: string,
  transactionTimestamp: string,
): string {
  const content = `${hashPrevious}${canonicalPayloadJson}${transactionTimestamp}`;
  return crypto.hash('sha256', content, 'hex');
}
```

### Sharding the Chain (Zero Contention Invariant)
- **Scale the chain — don't serialise all writes through one global chain.** A single strictly-sequential hash chain forces every write to wait on the previous row's hash, which becomes a contention point under concurrent load.
- **Sharded Architecture:** Shard chains per logical partition — either per **tenant workspace** (`workspace_subdomain`) or per **aggregate domain** (e.g. `contacts`, `finance`).
- **Merkle Rollup & Certificate-Transparency Scaling:** Periodically (e.g. hourly or daily), roll the heads of all shard chains into a Merkle tree. Store and publish the Merkle root in `audit_merkle_roots` and public transparency checkpoints. This is the same technique certificate-transparency logs use to make tamper-evidence scale under concurrent writes — verify against the published root rather than replaying one global serial chain.

### Scheduled Automated Verification
- Run automated chain (or Merkle-root) verification on a fixed schedule.
- Traverse the sequence from the last verified root, recomputing expected hashes and checking for missing IDs or broken links.
- Store verification results in a separate append-only table (`audit_verification_runs`).
- Alert on broken chains, missing records, or sequence gaps — don't rely on someone noticing during a manual audit.

### Statement-Level Auditing & Access Hardening
- **Statement-Level Auditing (`pgAudit`):** Statement-level logging is complementary, not a substitute. A row-based audit table only captures writes that go through your application's write path. It won't see ad-hoc `SELECT`s, direct database console access, or DDL. Pair it with database-native statement/session auditing (`pgAudit`) to close that gap.
- **Privilege Hardening:**
  - The service writing transactional data gets `INSERT`-only privileges on the audit schema:
    `GRANT INSERT, SELECT ON audit_trail_events TO mms_app_user;`
  - Revoke `UPDATE`/`DELETE` on audit tables from every role, including the application's own database user:
    `REVOKE UPDATE, DELETE, TRUNCATE ON audit_trail_events FROM PUBLIC, mms_app_user, mms_admin;`
  - Direct Read Access: Read access is a separate role, MFA-enforced, and ideally just-in-time (break-glass access that's granted, logged, and expires — not a standing grant).
- **Scope Blockchain/Decentralized Anchoring Correctly:** It solves one specific problem: proving integrity to an external party without that party trusting your database administrators. Most systems don't have that requirement. Treat it as an optional addition for cases with an explicit external-evidentiary need (e.g. a regulator or court requires proof independent of your own infrastructure) — not a default "layer" every audit system should build.

---

## 4. Privacy, Retention, and Right-to-Erasure

Immutable audit logs and a "right to erasure" obligation are in direct tension. Resolve it with one of two recognized patterns — don't resolve it by deleting or rewriting historical rows, which breaks the hash chain:

### Pattern A: Crypto-Shredding (Primary Architecture)
1. Encrypt personal-data fields with a per-subject (or per-record) key at write time (e.g. AES-256-GCM).
2. Store subject keys in `crypto_shredding_keys` managed via KMS / envelope encryption.
3. Upon receiving an erasure request:
   - Destroy the subject's encryption key (`status = 'SHREDDED'`, zero out key material).
   - The audit row, its hash, and its position in the chain are untouched.
   - The ciphertext remains in `old_state`/`new_state`, but becomes permanently unrecoverable mathematical noise.
   - Scales cleanly to bulk erasure requests without mutating table rows.

### Pattern B: Redact-and-Append
1. Replace the personal-data values in-place with a fixed redaction marker: `"[REDACTED_PER_REQUEST]"`.
2. Append a NEW audit log row with `action_type = 'REDACT'`, specifying `recordId`, `erasureRequestId`, timestamp, and actor.
3. **NEVER** recompute `hash_previous` or `hash_current` on the redacted rows — the chain attests to *when* the redaction happened, not to a rewritten history.

### Regulatory Retention Floors
- **HIPAA:** 6 years (if health records are in scope).
- **SOX:** 7 years (if listed-company financials are in scope).
- **PCI-DSS:** 1 year (3 months online). Avoid storing card data in the audit trail at all — reference a tokenised payment-processor record instead.
- **Regional Privacy Laws (GDPR / equivalent):** Varies by data category. Verify your jurisdiction's law is actually enacted and in force before treating a draft bill as binding.
- **Automated Retention Enforcement:** Automate retention enforcement as policy-driven purging (on the *encrypted-key* lifecycle for crypto-shredded data, or on the *raw row* lifecycle for non-personal audit data) rather than manual review.

---

## 5. PostgreSQL Schema, Partitioning & Privilege Hardening

### Complete 5-Dimension Audit Schema with Monthly Partitioning
```sql
CREATE TABLE audit_trail_events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  workspace_subdomain varchar(64) NOT NULL,
  table_name varchar(64) NOT NULL,
  record_id varchar(128) NOT NULL,
  action_type varchar(32) NOT NULL,
  real_user_id varchar(64) NOT NULL,
  impersonated_user_id varchar(64),
  ip_address varchar(45),
  client_app varchar(64),
  session_id varchar(128),
  correlation_id varchar(128) NOT NULL,
  api_endpoint varchar(255),
  http_method varchar(16),
  old_state jsonb,
  new_state jsonb,
  hash_previous varchar(64) NOT NULL,
  hash_current varchar(64) NOT NULL,
  verification_status varchar(32) NOT NULL DEFAULT 'VERIFIED',
  transaction_timestamp timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (workspace_subdomain, transaction_timestamp, id)
) PARTITION BY RANGE (transaction_timestamp);

-- Monthly partition bounds
CREATE TABLE audit_trail_events_y2026m09 PARTITION OF audit_trail_events
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

-- Automated verification runs table (append-only)
CREATE TABLE audit_verification_runs (
  id varchar(64) PRIMARY KEY,
  verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  records_checked integer NOT NULL,
  status varchar(32) NOT NULL,
  discrepancies jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Merkle root rollups for certificate-transparency checkpoints
CREATE TABLE audit_merkle_roots (
  id varchar(64) PRIMARY KEY,
  root_hash varchar(64) NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  shard_count integer NOT NULL,
  published_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- Crypto-shredding keys table
CREATE TABLE crypto_shredding_keys (
  id varchar(64) PRIMARY KEY,
  subject_id varchar(128) NOT NULL,
  encrypted_key text NOT NULL,
  algorithm varchar(32) NOT NULL DEFAULT 'AES-256-GCM',
  status varchar(16) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  destroyed_at timestamptz
);

-- Erasure requests log
CREATE TABLE audit_erasure_requests (
  id varchar(64) PRIMARY KEY,
  subject_id varchar(128) NOT NULL,
  regime varchar(32) NOT NULL,
  erasure_type varchar(32) NOT NULL,
  requested_by varchar(64) NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz,
  redaction_marker varchar(64) NOT NULL DEFAULT '[REDACTED_PER_REQUEST]'
);

-- Strict privilege hardening
REVOKE UPDATE, DELETE, TRUNCATE ON audit_trail_events FROM PUBLIC, mms_app_user, mms_admin;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_verification_runs FROM PUBLIC, mms_app_user, mms_admin;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_merkle_roots FROM PUBLIC, mms_app_user, mms_admin;

GRANT INSERT, SELECT ON audit_trail_events TO mms_app_user;
GRANT INSERT, SELECT ON audit_verification_runs TO mms_app_user;
GRANT INSERT, SELECT ON audit_merkle_roots TO mms_app_user;
GRANT ALL ON crypto_shredding_keys TO mms_app_user;
GRANT ALL ON audit_erasure_requests TO mms_app_user;

-- Monthly date partition detachment for zero-downtime archival (prevents DELETE table locks and WAL bloat)
ALTER TABLE audit_trail_events DETACH PARTITION audit_trail_events_y2026m06;
```

---

## 6. Monitoring & Auditing the Auditor

- **Integrity Monitoring:** Automated chain verification on schedule; alert on breaks, gaps, or missing records.
- **Anomaly Detection Baselining:**
  - Baseline normal write volume and access patterns per actor.
  - Alert on spikes (>300% of baseline), after-hours activity, or geographically implausible access.
  - Reserve ML-based detection for when rule-based baselining stops catching real incidents — it's a scaling step, not a starting point.
- **Compliance Reporting & Auditing the Auditor:**
  - Automate report generation and tamper-evident export (include chain/Merkle verification in the export itself).
  - Log who accessed audit data and when — access to the audit trail is itself an auditable event (`action_type = 'VIEW'`, `tableName = 'audit_trail_events'`).
- **Tamper-Evident Compliance Export:**
  - When generating exports (`POST /api/audit/export`), include the cryptographic chain hashes, partition Merkle proof, and verification signature in the export metadata.

---

## 7. Storage Lifecycle Tiering

| Tier | Window | Format | Invariants |
|---|---|---|---|
| **Hot** | 0–30 days | PostgreSQL Monthly Partitions | Real-time indexing, active verification, partition detachment instead of `DELETE`. |
| **Warm** | 31–90 days | Read-only partitions / time-series store | Partition detached from hot OLTP; queried for audits and investigations. |
| **Cold** | 91+ days | Columnar (Parquet/ORC) on WORM object storage | Immutable S3 Object Lock; "cold" without immutability is merely cheaper storage, not tamper-evident storage. Carry chain hash / Merkle root proof alongside each batch. |

- Partition by date (monthly is typical). It bounds index size, speeds time-bound queries, and makes archiving a partition-detach operation instead of a `DELETE`.
- Cold storage must be WORM-enforced (S3 Object Lock, immutable blob storage, or equivalent) — "cold" without immutability is just cheaper storage, not tamper-evident storage.
- Carry the relevant chain hash (or Merkle root) alongside each archived batch so a detached partition can still be verified after archival.

---

## 8. Five-Phase Implementation Roadmap

| Phase | Deliverables |
|---|---|
| **1. Foundation** | Payload schema with RFC 8785 canonical JSON, append-only privilege model (`INSERT`-only), monthly date partitioning |
| **2. Core capture** | Outbox or CDC deployment, W3C `traceparent` correlation-ID propagation, initial monitoring |
| **3. Integrity** | Sharded hash chaining, Merkle tree rollups, scheduled automated verification job, alerting |
| **4. Privacy** | Crypto-shredding key management or redact-and-append erasure path, automated policy-driven retention purging |
| **5. Advanced** | Tiered storage lifecycle with WORM S3 Object Lock, rule-to-ML anomaly detection baselining, external anchoring only if stated requirement exists |

---

## Checklist for New Audit Implementations

- [ ] 5 dimensions populated (Who, What, When, Why, Integrity)
- [ ] RFC 8785 Canonical JSON used for payload hashing and state deltas
- [ ] Non-essential PII and secrets stripped from old/new state
- [ ] W3C `traceparent` extracted from request and saved as `correlationId`
- [ ] Written atomically inside transactional outbox (`withTenantTransaction`)
- [ ] Sharded per tenant partition (no global sequential hash contention)
- [ ] Crypto-shredding or redact-and-append configured for erasure
- [ ] `UPDATE` and `DELETE` revoked on database audit tables
- [ ] Scheduled automated verification job configured and alerting to P1 channel
- [ ] Access to audit records logged as an auditable event
- [ ] Cold storage archive batches carry chain hash / Merkle root proof on WORM-locked storage
