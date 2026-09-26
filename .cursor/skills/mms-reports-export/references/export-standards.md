# MMS Export Standards & Compliance Specifications

**Rules SSOT:** `mms-reports.md` · `mms-data-layer.md` §5 · `mms-performance.md` §1–§2

## Export Formats & Size Gates

| Format | Implementation | Size gate | Notes |
|--------|----------------|-----------|-------|
| Print | CSS `@media print` | any | Set `isAnimationActive={false}` on charts for print |
| CSV | Streaming `ReadableStream` → `Blob` | always stream | No full in-memory stringify |
| Excel | `xlsx` via dynamic `import()` (FE inline) | ≤500 rows | `resolveRows` callback — never pass raw in-memory array >1000 items |
| Excel large | Backend ExcelJS stream pipe via BullMQ | >500 rows → background | Background job + tray download |
| PDF | `jspdf` + `jspdf-autotable` (FE inline) | ≤200 rows | |
| PDF large | Backend Typst worker via BullMQ | >200 rows → background | Background job + tray download |

- Use shared `ExportToolbar` — always use `columns` + `rows` prop API (not deprecated `data` + `headers`).
- Escape untrusted text cells with formula prefixes (`=`, `+`, `-`, `@`) using the format-specific export helper; preserve legitimate signed numeric cells as numbers. Advisory: test separator, whitespace and control-character payloads in the target format.
- Standard export filename: `{module}-report-{date-range}-{YYYY-MM-DD}.{ext}`.
- Include `generatedAt` timestamp and `generatedBy` metadata in export headers.
- Respect filters, RBAC permissions, field visibility, and soft-delete policy (`exportsIncludeDeleted` from module manifest).
- Log all PII exports to audit log before streaming.
- Background export jobs must emit BullMQ progress events at $\ge 10\%$ increments.

## Tamper-Evident Compliance & Audit Exports

Advisory design guidance for evidence exports targeting `audit_trail_events`; cryptographic metadata alone does not establish regulatory compliance. Verify actual endpoint support and applicable retention/access policies before claiming these capabilities:
- **Cryptographic Attestation in Exports**: When exporting audit records (`POST /api/audit/export`), embed the cryptographic chain hash, the published Merkle root proof, and verification status in document metadata (PDF properties or JSON envelope).
- **Auditing the Auditor**: Every view, query, filter evaluation, or export targeting audit logs must itself emit an immutable audit event (`action_type: 'VIEW'`, `tableName: 'audit_trail_events'`).
- **Data Minimization**: Compliance exports must strip raw decrypted PII unless explicitly requested under an authorized break-glass session.

## Accounting exports

Advisory: distinguish live report definitions from issued financial evidence packs; use consistent cutoff, currency, filters and reconciled totals. Follow [closing and reporting](../../mms-finance-accounting/references/closing-reporting.md) for stock/flow semantics and issuance metadata.
