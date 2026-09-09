# Modern Database Audit Trails: Best Practices

An audit trail records the complete context of every state change independently of the transactional tables it describes. It must be tamper-evident, queryable without degrading primary workloads, and resolvable against right-to-erasure obligations without breaking its own integrity guarantees.

---

## 1. Audit Payload Design

Capture five dimensions per event. Store row states as canonical JSON so hashing and comparison are deterministic across languages and services — use [RFC 8785 (JSON Canonicalization Scheme)](https://datatracker.ietf.org/doc/html/rfc8785) rather than an ad-hoc "sort keys, strip whitespace" convention, so canonicalisation is interoperable across your stack.

| Dimension | Required fields | Purpose |
|---|---|---|
| **Who** | `real_user_id`, `impersonated_user_id` (if any), `ip_address`, `client_app`, `session_id` | Traces both the human/system actor and any impersonated context. |
| **What** | `table_name`, `record_id`, `old_state`, `new_state` (canonical JSON) | Exact point-in-time state reconstruction. |
| **When** | `transaction_timestamp` (UTC, microsecond precision) | Timeline accuracy under concurrent writes. |
| **Why** | `correlation_id`, `action_type` (CREATE, UPDATE, DELETE, VIEW, LOGIN), `api_endpoint`, `http_method` | Links a database write back to the request or business event that caused it. |
| **Integrity** | `hash_previous`, `hash_current`, `verification_status` | Tamper-evidence (Section 3). |

**Use a real trace ID for `correlation_id`, not a bespoke UUID.** Propagate the [W3C Trace Context](https://www.w3.org/TR/trace-context/) `traceparent` value as (or alongside) the correlation ID. This lets audit rows be correlated directly with your observability/tracing stack instead of maintaining a parallel, audit-only identifier.

**Minimise at capture time.** Don't log full PII payloads into `old_state`/`new_state` if the field isn't needed for reconstruction — every field captured is a field you must later handle under an erasure request (Section 4).

---

## 2. Capture Patterns

| Pattern | Best for | Overhead | Consistency |
|---|---|---|---|
| **Change Data Capture (CDC)** | High-throughput systems where you can't touch application code | Near-zero on the primary; async downstream | Eventual |
| **Application-level Outbox** | New services; strong consistency required | Low (writes inside the existing transaction) | Strong |
| **Event Sourcing** | Domains where the event log *is* the system of record | None — it's the primary architecture | Strong |
| **Hybrid (CDC + Outbox)** | Large systems with mixed workloads | Variable | Configurable |

CDC (e.g. Debezium reading the write-ahead log into Kafka) is the right default when you want zero write-path overhead and can tolerate eventual consistency. Outbox is the right default when you need strong consistency and don't want to stand up streaming infrastructure. Don't reach for Event Sourcing purely for audit purposes — it's an architectural commitment, not an audit feature; adopt it only if your domain already benefits from an event-sourced model for reasons beyond auditing.

---

## 3. Cryptographic Integrity

**Chain construction:**
```
hash_current = SHA-256(hash_previous + canonical_json(payload) + timestamp)
```

**Scale the chain — don't serialise all writes through one global chain.** A single strictly-sequential hash chain forces every write to wait on the previous row's hash, which becomes a contention point under concurrent load. Shard the chain per logical partition (per tenant, per aggregate type, or per time-window) and periodically roll shard heads up into a Merkle tree, publishing the Merkle root at fixed intervals. This is the same technique certificate-transparency logs use to make tamper-evidence scale under concurrent writes — verify against the published root rather than replaying one global serial chain.

**Verification:**
- Run automated chain (or Merkle-root) verification on a fixed schedule.
- Store verification results in a separate append-only table.
- Alert on broken chains, missing records, or sequence gaps — don't rely on someone noticing during a manual audit.

**Statement-level logging is complementary, not a substitute.** A row-based audit table only captures writes that go through your application's write path. It won't see ad-hoc `SELECT`s, direct database console access, or DDL. Pair it with database-native statement/session auditing (e.g. PostgreSQL's `pgAudit`, or the equivalent for your engine) to close that gap.

**Access control:**
- The service writing transactional data gets `INSERT`-only privileges on the audit schema.
- Read access is a separate role, MFA-enforced, and ideally just-in-time (break-glass access that's granted, logged, and expires — not a standing grant).
- Revoke `UPDATE`/`DELETE` on audit tables from every role, including the application's own database user.

**Scope blockchain/decentralised anchoring correctly.** It solves one specific problem: proving integrity to an external party without that party trusting your database administrators. Most systems don't have that requirement. Treat it as an optional addition for cases with an explicit external-evidentiary need (e.g. a regulator or court requires proof independent of your own infrastructure) — not a default "layer" every audit system should build.

---

## 4. Privacy, Retention, and Erasure

Immutable audit logs and a "right to erasure" obligation are in direct tension. Resolve it with one of two recognised patterns — don't resolve it by deleting or rewriting historical rows, which breaks the hash chain:

1. **Crypto-shredding.** Encrypt personal-data fields with a per-subject (or per-record) key at write time. To "erase" a subject, destroy their key rather than the row. The audit row, its hash, and its position in the chain are untouched; the plaintext becomes permanently unrecoverable. This is the more rigorous option and scales cleanly to bulk erasure requests.
2. **Redact-and-append.** Replace the personal-data values in-place with a fixed redaction marker, and record the redaction itself as a new chained row (`action_type = REDACT`). Never recompute `hash_previous`/`hash_current` on the redacted rows — the chain attests to *when* the redaction happened, not to a rewritten history.

| Regime | Retention floor | Notes |
|---|---|---|
| HIPAA | 6 years | If health records are in scope. |
| SOX | 7 years | If listed-company financials are in scope. |
| PCI-DSS | 1 year (3 months online) | Avoid storing card data in the audit trail at all — reference a tokenised payment-processor record instead. |
| GDPR / equivalent regional laws | Varies by data category | Right-to-erasure requires one of the two patterns above; verify your jurisdiction's law is actually enacted and in force before treating a draft bill as binding. |

Automate retention enforcement as policy-driven purging (on the *encrypted-key* lifecycle for crypto-shredded data, or on the *raw row* lifecycle for non-personal audit data) rather than manual review.

---

## 5. Storage and Lifecycle

| Tier | Timeframe | Typical format | Access pattern |
|---|---|---|---|
| Hot | 0–30 days | Partitioned relational tables | Full query, real-time |
| Warm | 31–90 days | Time-series store or older partitions | Time-bound queries, limited aggregation |
| Cold | 91+ days | Columnar (Parquet/ORC) on WORM-locked object storage | On-demand, infrequent |

- Partition by date (monthly is typical). It bounds index size, speeds time-bound queries, and makes archiving a partition-detach operation instead of a `DELETE`.
- Cold storage must be WORM-enforced (S3 Object Lock, immutable blob storage, or equivalent) — "cold" without immutability is just cheaper storage, not tamper-evident storage.
- Carry the relevant chain hash (or Merkle root) alongside each archived batch so a detached partition can still be verified after archival.

---

## 6. Monitoring

- **Integrity monitoring:** automated chain verification on schedule; alert on breaks, gaps, or missing records.
- **Anomaly detection:** baseline normal write volume and access patterns per actor; alert on spikes, after-hours activity, or geographically implausible access. Reserve ML-based detection for when rule-based baselining stops catching real incidents — it's a scaling step, not a starting point.
- **Compliance reporting:** automate report generation and tamper-evident export (include chain/Merkle verification in the export itself), and log who accessed audit data and when — access to the audit trail is itself an auditable event.

---

## 7. Implementation Roadmap

| Phase | Deliverables |
|---|---|
| 1. Foundation | Payload schema with canonical JSON, append-only privilege model, basic partitioning |
| 2. Core capture | Outbox or CDC deployment, correlation-ID propagation, initial monitoring |
| 3. Integrity | Hash/Merkle chaining, automated verification job, alerting |
| 4. Privacy | Crypto-shredding or redact-and-append erasure path, retention automation |
| 5. Advanced | Tiered storage automation, anomaly detection, external anchoring only if a stated requirement exists |
