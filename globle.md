# Universal Module Architecture & Logic Schema

This document defines the universal structural logic, behavioural standards, and administrative rules that apply to all standard directory-based modules within the application ecosystem.

All standard modules must follow this architecture, except specialised master modules such as the main Dashboard, which may have separate logic due to its cross-system nature.

---

## 1. Global System Foundation

Every module operates under a shared foundation to ensure consistency, security, scalability, and predictable user experience across the entire application.

### 1.1 Universal Module Contract

Each module must be governed by a formal module contract. This contract acts as the single source of truth for how the module behaves, what data it manages, what permissions apply, what fields are available, how reports work, and how users interact with the module.

The module contract defines:

- The module identity.
- The entity managed by the module.
- The available tabs and fields.
- The default workflow rules.
- The permissions structure.
- The reporting and export behaviour.
- The validation and business rules.
- The customisation limits.
- The audit and history requirements.

All frontend behaviour, backend rules, reporting logic, export behaviour, and administrative settings must follow this contract.

---

### 1.2 Role-Based Access Control

Every module inherits the global permission system.

Access to modules, tabs, fields, records, reports, exports, and actions is controlled by the active user's role and assigned permissions.

The interface may hide unavailable options from the user, but security must never depend only on visual hiding. All sensitive actions must be checked against the permission system before execution.

Permission logic may operate at several levels:

- Module-level access.
- Record-level access.
- Field-level access.
- Action-level access.
- Report-level access.
- Export-level access.
- Setup-level access.

Users should only see and interact with the data and actions they are authorised to use.

---

### 1.3 Audit Logging

All important system actions must be recorded for accountability, traceability, and compliance.

The audit system must track:

- Who performed the action.
- What action was performed.
- When the action occurred.
- Which record, field, report, export, or setting was affected.
- What changed before and after the action.
- Whether the action was manual, automated, bulk, or system-triggered.

Audit logging applies to:

- Record creation.
- Record updates.
- Record deletion or restoration.
- Bulk operations.
- Data exports.
- Record merges.
- Permission changes.
- Setup changes.
- Sensitive data access where required.

Audit history must be protected from unauthorised editing or deletion.

---

### 1.4 Offline and Online State Management

Modules must support stable behaviour during temporary network interruptions.

When the system is offline or unstable, users may continue basic permitted actions where safe. These actions are stored locally and synchronised once the connection is restored.

The system must clearly inform users when:

- They are offline.
- Changes are pending synchronisation.
- Synchronisation succeeds.
- Synchronisation fails.
- A conflict has occurred.

If the same record is changed by multiple users or devices, the system must detect the conflict and apply a defined resolution rule. Sensitive or high-impact conflicts should be sent for user review rather than being silently overwritten.

---

### 1.5 Universal Soft Deletion

Records must not be permanently removed through normal user actions.

When a record is deleted, it is hidden from the standard interface but preserved for history, reporting, audit, and relationship integrity.

Soft-deleted records must retain:

- The deletion status.
- The deletion time.
- The user who deleted the record.
- The reason for deletion, where required.
- The restoration history, if restored later.

The system must define whether deleted records are included or excluded from reports, exports, searches, relationship lookups, and duplicate checks.

Permanent removal, where legally or operationally required, must follow a separate privileged process.

---

### 1.6 Data Integrity and Consistency

Every module must protect the accuracy and reliability of its data.

The system must prevent invalid records, broken relationships, unauthorised changes, duplicate damage, and uncontrolled configuration changes.

Data integrity rules apply to:

- Required fields.
- Valid field formats.
- Unique values.
- Relationship rules.
- Workflow status transitions.
- Duplicate detection.
- Merge decisions.
- Custom field changes.
- Report and export accuracy.

The system should prioritise correctness over convenience in all critical operations.

---

## 2. Top Dashboard: Module Command Centre

Each standard module includes an always-visible top dashboard that acts as the command centre for that module.

This section gives users immediate access to key metrics, creation actions, export controls, data integrity tools, and module-level operational commands.

The top dashboard remains available while the user works inside the module.

---

### 2.1 Dynamic Quick Metrics

Each module displays high-level operational metrics.

These metrics may include:

- Total active records.
- Records currently shown after search and filters.
- New records within a selected period.
- Pending records.
- Incomplete records.
- Duplicate warnings.
- Other module-specific indicators.

Metrics must respect user permissions. A user should not see counts based on records they are not allowed to access.

---

### 2.2 Data Integrity and Deduplication Engine

Each module may include a deduplication engine to identify records that appear to represent the same entity.

The engine compares meaningful identifying information such as names, contact details, reference numbers, identity values, or other module-specific fields.

When possible duplicates are found, the system should show:

- The records being compared.
- The reason they were matched.
- The confidence level of the match.
- The differences between the records.
- The safest recommended merge option.

Users must confirm a merge before it happens.

The merge process must preserve history, respect permissions, avoid data loss, and allow review or rollback where possible.

The system must not automatically assume that the newest data is always the most correct. Merge rules should be based on field importance, data reliability, user confirmation, and module-specific business logic.

---

### 2.3 Universal Export Controller

Each module includes a controlled export function.

Exports must respect:

- Active filters.
- Search results.
- User permissions.
- Field visibility rules.
- Data sensitivity rules.
- Soft deletion rules.
- Module export policy.

Small exports may be generated immediately. Large exports should be processed in the background, with the user notified when the file is ready.

Every export should be recorded in the audit history, especially when sensitive or large datasets are involved.

---

### 2.4 Add Entity Creation Engine

Each module includes a primary creation action for adding a new entity record.

The creation interface is generated from the module’s approved structure and administrative configuration.

The form should display only the tabs and fields that are visible and allowed for the active user.

The creation process must follow:

- Required field rules.
- Field format rules.
- Permission rules.
- Default value rules.
- Business validation rules.
- Duplicate warning rules.
- Workflow status rules.

If validation fails, the system must guide the user to the exact location of the issue and prevent submission until the problem is resolved.

---

## 3. Tab 1: Work — Operational Directory

The Work tab is the primary operational area of each module. It is used for daily record management, searching, filtering, viewing, editing, and bulk actions.

---

### 3.1 Main Directory View

The main directory displays records in a structured and searchable format.

The directory must support:

- Search.
- Filters.
- Sorting.
- View switching.
- Column or field visibility preferences.
- Bulk selection.
- Row-level actions.
- Status indicators.
- Permission-aware visibility.

The directory should be optimised for fast decision-making and daily productivity.

---

### 3.2 Search and Filtering Logic

Search and filters allow users to narrow down visible records.

Search should work across approved searchable fields. Filters should be available for approved filterable fields, including authorised custom fields.

When multiple filters are applied, they should work together logically to narrow the result set.

Filtering must respect user permissions and must not expose restricted fields or restricted record groups.

---

### 3.3 Responsive View Logic

The Work tab must adapt to the user’s device and screen size.

Larger screens should favour dense table or grid layouts for productivity and bulk actions.

Smaller screens should favour card-based layouts that are easier to read and use on touch devices.

Both views must follow the same permission, search, filter, and action rules.

---

### 3.4 Field and Column Preferences

Users may customise which fields or columns they see in the directory, where permitted.

These preferences should be saved per user and per module so that each user’s working layout remains consistent across sessions.

Administrative rules may prevent certain important fields from being hidden.

---

### 3.5 Detail Drawer

Selecting a record opens a detailed view without forcing the user to leave the directory.

The detail drawer displays the complete permitted record information using the same tab structure defined for the module.

The drawer must respect:

- Tab visibility.
- Field visibility.
- Field order.
- User permissions.
- Custom tabs.
- Custom fields.
- Related data rules.

Editing inside the drawer should be clear, safe, and traceable. Important changes should show confirmation, save state, and error feedback.

Sensitive or high-impact fields may require explicit saving rather than automatic saving.

---

### 3.6 Bulk Operations and Action Bar

When one or more records are selected, the system displays a bulk action area.

Bulk actions may include:

- Bulk update.
- Bulk message.
- Bulk assignment.
- Bulk status change.
- Bulk export.
- Bulk archive.
- Bulk delete.
- Other module-specific actions.

Bulk actions must respect user permissions and must verify that the selected records are eligible for the requested action.

For large operations, the system should process actions in controlled batches and show progress, completion status, and failure details.

Partial failures must be clearly reported.

---

### 3.7 Template-Based Actions

Modules may allow users to create and reuse templates for repeated actions.

Templates may be used for:

- Messages.
- Emails.
- Status updates.
- Task instructions.
- Bulk action presets.
- Report filters.
- Export formats.

Templates should be linked to the module and may be personal, role-based, or shared depending on permissions.

---

## 4. Tab 2: Reports — Dynamic Analytics Engine

The Reports tab provides a universal reporting system that reads authorised module data and transforms it into meaningful insights.

Reports must always respect the same permissions as the Work tab.

A user must not be able to access restricted records or hidden fields through reports, charts, summaries, drill-downs, or exports.

---

### 4.1 Query Builder

The reporting engine should allow users to build reports visually without writing technical queries.

Users may filter, group, compare, summarise, and segment data based on authorised fields.

Custom fields and custom tabs may be included in reports only when they are approved for reporting and visible to the active user.

---

### 4.2 Report Visualisation Logic

The system should suggest suitable visualisations based on the type of data being reported.

For example:

- Time-based data may be shown as trends.
- Category-based data may be shown as comparisons.
- Status-based data may be shown as distribution.
- Numeric data may be shown as summaries or performance indicators.

Users should be able to switch between suitable visual formats where appropriate.

---

### 4.3 Drill-Down Logic

Reports should allow users to move from summary insight to the underlying records.

When a user selects a chart segment, metric, or report row, the system should open the related filtered records in the Work tab.

The drill-down must preserve the same permission, filter, and visibility rules as the original report.

---

### 4.4 Saved Reports

Saving a report should save the report logic, not a frozen copy of the data.

When a saved report is opened, the system should run it against current authorised data.

Saved reports may be:

- Private to the creator.
- Shared with selected roles.
- Shared with selected users.
- Available globally, where permitted.

Changes to fields, permissions, or module setup must not silently break saved reports. If a report depends on a field that has been hidden, archived, or restricted, the system should clearly explain the issue.

---

## 5. Tab 3: Setup — Administrative Configuration

The Setup tab controls how the module behaves.

It is available only to authorised administrative users.

Changes made in Setup may affect the Work tab, Reports tab, Top Dashboard, forms, filters, exports, permissions, and validation logic.

All Setup changes must be audited.

---

## 6. Setup Area 1: Fields, Tabs, and Form Structure

This area controls the structure of the module’s forms and detail views.

The system supports both predefined and custom structure.

---

### 6.1 Predefined Tabs and Fields

Predefined tabs and fields are part of the module’s core design.

They support essential business logic and cannot be permanently removed by normal administrators.

Predefined tabs may be hidden if allowed, but hiding them must not damage existing data or break required system behaviour.

Predefined fields may have restricted editing rules depending on their importance to the module.

---

### 6.2 Custom Tabs and Fields

Custom tabs and fields allow authorised administrators to extend the module without changing the core system.

Custom tabs may be created, renamed, reordered, hidden, archived, or removed according to system rules.

Custom fields may be added to predefined or custom tabs.

Every custom field must have:

- A clear label.
- A defined field type.
- A location within a tab.
- Visibility rules.
- Permission rules.
- Validation rules where needed.
- Reporting and filtering eligibility where needed.

Customisation must be flexible but controlled so that performance, reporting, exports, and data quality remain stable.

---

### 6.3 Tab Ordering and Visibility

The module form structure follows a unified tab order.

Predefined and custom tabs may be arranged together if the administrator has permission.

Hidden tabs are not shown in standard forms or detail views, but their historical data remains preserved.

Field and tab visibility must apply consistently across:

- Creation forms.
- Detail drawers.
- Edit views.
- Reports.
- Exports.
- Filters.
- Search.
- Mobile views.

---

### 6.4 Field Assignment Logic

Every field belongs to a specific tab.

Fields may be moved between allowed tabs according to administrative permissions and business rules.

Moving a field should not change or erase the existing data stored under that field.

If a field is required, hidden, restricted, or used in reports, the system must warn administrators before allowing structural changes that may affect users.

---

### 6.5 Required Field Logic

Administrators may mark fields as required where allowed.

Required field rules apply everywhere the field is used, including creation, editing, imports, and relevant bulk operations.

If a required field is placed inside a custom tab, the system must still guide users clearly to that field when validation fails.

A field should not be made required if existing records would become invalid without a defined correction process.

---

### 6.6 Field Archiving and Deletion

Custom fields should generally be archived rather than permanently deleted.

Archiving hides the field from normal use while preserving existing data, reports, history, and audit records.

Permanent deletion should be restricted and allowed only when the field has no important dependencies.

Before removing a field or tab, the system must check whether it is used in:

- Existing records.
- Reports.
- Filters.
- Exports.
- Templates.
- Automations.
- Permissions.
- Dashboards.
- Audit history.

---

## 7. Setup Area 2: Preferences and Business Rules

This area controls the module’s operational behaviour, default values, visual rules, and business settings.

---

### 7.1 Smart Defaults

Administrators may define default values for fields and statuses.

Defaults help speed up data entry and standardise records.

Users may override defaults unless the field or workflow rule prevents it.

Defaults must apply consistently across manual creation, imports, templates, and other permitted creation methods.

---

### 7.2 Visual Categorisation

Administrators may define visual styles for statuses, tags, categories, priorities, or other approved indicators.

These visual rules should appear consistently across:

- Directory views.
- Detail drawers.
- Reports.
- Dashboards.
- Mobile views.
- Exports where applicable.

Visual indicators should improve clarity but must not replace clear text labels.

---

### 7.3 Workflow and Status Rules

Modules may include workflow rules that control how records move between statuses or stages.

Workflow rules may define:

- Valid statuses.
- Allowed status transitions.
- Required fields before a transition.
- Permission rules for each transition.
- Notifications triggered by changes.
- Restrictions on editing closed or archived records.

Workflow behaviour must be predictable and auditable.

---

### 7.4 Notification Rules

Modules may support notifications for important events.

Notifications may be triggered by:

- New record creation.
- Assignment changes.
- Status changes.
- Missed required information.
- Duplicate warnings.
- Failed sync.
- Completed exports.
- Bulk action completion.
- Report thresholds.

Notification rules must respect user roles, preferences, and data permissions.

---

## 8. Background Jobs and Queued Processing

Large or slow operations should not block normal user activity.

The system should use background processing for:

- Large exports.
- Bulk messaging.
- Bulk updates.
- Data imports.
- Deduplication scans.
- Large report generation.
- Synchronisation recovery.

Users should be able to see:

- Job status.
- Progress.
- Completion result.
- Failure reason.
- Download or result link where applicable.

All background jobs must follow permission rules and audit requirements.

---

## 9. Error Handling and User Feedback

Every module must provide clear, helpful, and consistent feedback.

Users should be informed when:

- A validation error occurs.
- A required field is missing.
- A permission prevents an action.
- A record has changed elsewhere.
- A sync conflict occurs.
- A bulk action partially fails.
- A background job fails.
- A report cannot be loaded.
- An export cannot be generated.

Errors should explain what happened, where it happened, and what the user can do next.

The system should avoid silent failures.

---

## 10. Performance and Scalability Logic

All modules must remain fast and reliable as data grows.

The system should define limits and performance rules for:

- Directory loading.
- Search.
- Filtering.
- Custom fields.
- Reports.
- Exports.
- Bulk operations.
- Background jobs.
- Offline sync.
- Deduplication scans.

Large datasets should use controlled loading, background processing, and optimised search behaviour.

The system must avoid loading unnecessary data when summary or filtered data is sufficient.

---

## 11. Accessibility and Responsive Experience

Every module must be usable across devices and accessible to different users.

The interface should support:

- Keyboard navigation.
- Clear focus states.
- Readable labels.
- Sufficient contrast.
- Mobile-friendly layouts.
- Meaningful error messages.
- Non-colour-only indicators.
- Localised text where required.

Accessibility must be treated as part of the core architecture, not an optional visual enhancement.

---

## 12. Security and Data Protection

Every module must protect user data and business information.

Security rules must apply to:

- Permissions.
- Reports.
- Exports.
- Bulk actions.
- Setup changes.
- Offline data.
- Audit logs.
- Sensitive fields.
- Background jobs.
- Templates.
- Notifications.

Sensitive information should only be visible, exportable, or actionable by authorised users.

The system must prevent users from bypassing restrictions through reports, filters, exports, search, mobile views, or background jobs.

---

## 13. Module Change Management

Changes to module setup must be controlled and traceable.

When administrators modify fields, tabs, workflows, permissions, defaults, reports, or visual rules, the system must:

- Record the change.
- Identify who made it.
- Show what changed.
- Protect existing data.
- Warn about dependencies.
- Prevent destructive changes unless authorised.
- Support rollback where possible.

Configuration changes must cascade safely across Work, Reports, Dashboard, Forms, Exports, and Templates.

---

## 14. Universal Behaviour Principle

All modules must behave consistently.

A user who understands one module should be able to understand another module with minimal learning effort.

The universal module architecture ensures that every module follows the same core logic for:

- Navigation.
- Creation.
- Editing.
- Searching.
- Filtering.
- Reporting.
- Exporting.
- Permissions.
- Auditing.
- Customisation.
- Deletion.
- Recovery.
- Notifications.
- Background processing.

Individual modules may have specialised business rules, but they must not violate the universal architecture unless explicitly approved as a specialised exception.