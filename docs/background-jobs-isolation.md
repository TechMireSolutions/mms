# MMS Background Job Worker Isolation Plan

## 1. Problem Statement
Currently, Madrasa Management System (MMS) processes background jobs (such as duplicate contact scans, CSV data exports, and synchronisation recoveries) in-process within the main Fastify API thread. 

Running heavy, CPU-bound or memory-intensive jobs on the main thread poses several risks:
- **Event Loop Blockage:** Processing large collections (e.g. 10k+ contacts) blocks the Node.js event loop, preventing the API from handling HTTP requests and degrading response times.
- **Memory Starvation:** Heavy memory allocation in jobs can trigger Out-Of-Memory (OOM) fatal crashes, bringing down the entire API server.
- **Zero Durability:** If the API process crashes or restarts, all active background jobs fail silently without recovery mechanisms.

---

## 2. Distributed Queue Architecture (Phase 5: BullMQ + Redis 7+)

MMS isolates background tasks using BullMQ backed by Redis 7+ and PostgreSQL RLS:

```mermaid
graph TD
    Client[Client UI / HTTP Request] -->|1. POST /api/v1/.../export| Fastify[Fastify API Gateway]
    Fastify -->|2. Insert 'pending' job & Tenant RLS| DB[(PostgreSQL background_jobs)]
    Fastify -->|3. queue.add() with Priority & Retry Options| BullMQ[(Redis 7+ BullMQ Queues)]
    BullMQ -->|4. Pull next job by priority/concurrency| Worker[Worker Daemon (src/worker/index.ts)]
    Worker -->|5. Run processor with withTenant()| Exec[Job Runner Service]
    Exec -->|6. Publish progress/completion| RedisPubSub[(Redis Pub/Sub: mms:job-event)]
    RedisPubSub -->|7. Multi-node broadcast| WSHub[WebSocket Hub (src/lib/livePush.ts)]
    WSHub -->|8. Real-time update| Client
```

---

## 3. BullMQ Queue Tiers & Policies

| Queue Name | Concurrency | Priority | Target Workloads |
|---|---|---|---|
| `pdf-rendering` | 4 | 1 (Highest) | Report cards, fee receipts, examination transcripts |
| `bulk-export` | 2 | 2 (Normal) | Large CSV/Excel streaming exports, contact dedup scans |
| `messaging-broadcast` | 10 | 3 (Bulk) | Mass SMS / WhatsApp notification broadcasts |

### Resilience & DLQ Policies
- **Retry Policy**: 3 attempts with exponential backoff (`delay: 1000ms`).
- **Dead-Letter Queue (DLQ)**: On permanent failure after 3 attempts, logs a DLQ event and records failure status in PostgreSQL.
- **Orphan Cleanup**: On worker daemon startup, scans for any jobs in `running` state that were interrupted during a crash and marks them as failed.
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, waits for active workers to complete running jobs, and cleanly closes Redis connections.
