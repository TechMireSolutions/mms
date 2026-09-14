---
description: Work an open priority from mms-migration-status
---

# /fix-migration-debt — Fix Migration Debt

Run the MMS **Fix Migration Debt** workflow end to end.

1. Read `.agent/workflows/fix-migration-debt.md` and follow it exactly.
2. Owning rules are the norm SSOT — the workflow is the procedure. If they disagree, the rule wins and the workflow needs fixing.
3. Report each step's outcome and the verification you actually ran (`mms-completion-review.md`).

Do not improvise a shorter path: the workflow encodes gates (env verification, ratchets, checklists) that exist precisely because skipping them has caused regressions.
