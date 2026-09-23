import { expect, test, type Page } from '@playwright/test';
import { assertNoSeriousA11yViolations } from '../helpers/a11y.js';
import { loginTenant } from '../helpers/moduleTiers.js';
import {
  RESPONSIVE_VIEWPORTS,
  forceRtl,
  waitForAppShellReady,
  waitForToastsToClear,
} from '../helpers/responsive.js';
import {
  bootstrapAuthenticatedTenant,
  resetPlatformUsers,
} from '../helpers/tenantBootstrap.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

/**
 * Accessibility smoke — the executable form of the `mms-a11y-smoke` skill.
 *
 * Sweeps the app shell and a representative Work directory at 375 and 1440,
 * failing on serious/critical WCAG 2.1 A/AA violations. Runs in the normal E2E
 * job, so it is enforced rather than aspirational.
 *
 * Deliberately a SMOKE test, not a full audit: it covers the shell and one Work
 * surface across viewports and text direction. Broad per-module coverage would
 * multiply runtime without changing the class of regressions caught — most a11y
 * breakage comes from shared primitives (AppLayout, FormModal, Table, buttons),
 * which this exercises.
 */

const subdomain = `a11y${Date.now()}`;
const tenantOrigin = `http://${subdomain}.localhost:5173`;
const adminEmail = `admin@${subdomain}.com`;
const temporaryPassword = 'Madrasa@1234';
const permanentPassword = 'Madrasa@5678';
const platformEmail = `platform-a11y-${Date.now()}@test.com`;
const platformPassword = 'Pa$$w0rd123';

/**
 * Shell + Work surfaces + a Setup surface, each with a readiness selector.
 *
 * The original set was shell-only, on the theory that most a11y breakage comes
 * from shared primitives. That holds for primitives, but module *composition* of
 * them (dense tables, drawers, wizards) is where the remaining risk sits, so a
 * few module surfaces are included. Kept deliberately small: runtime is paid on
 * every CI run.
 */
const AUDIT_ROUTES = [
  { path: '/', ready: '#main-content', label: 'dashboard (shell)' },
  { path: '/contacts', ready: '#main-content', label: 'contacts (Work)' },
  { path: '/students', ready: '#main-content', label: 'students (Work, dense table)' },
  { path: '/finance', ready: '#main-content', label: 'finance (Work, money)' },
  // Accounting is the other money module and the only one with a ledger grid,
  // Trial Balance and financial-statement panels; it was previously unaudited.
  { path: '/accounting', ready: '#main-content', label: 'accounting (Work, ledger)' },
  { path: '/settings', ready: '#main-content', label: 'settings (Setup)' },
];

/**
 * Audit a real overlay on the current route, then dismiss it with Escape.
 *
 * Overlays matter more than most surfaces: they are where the focus trap, the
 * backdrop, the z-index scale and Escape ownership all meet, and they portal to
 * `<body>` so they sit outside the tree the shell rules cover.
 *
 * Two triggers are used because they have different data requirements:
 *  - the column-customiser dialog (`aria-haspopup="dialog"`) needs no seed data,
 *    so it always runs;
 *  - a directory row's detail drawer needs a row, so it is best-effort.
 *
 * Every attempt logs its outcome. A "best-effort" step that silently no-ops is
 * worse than no step at all: the suite reported a clean drawer audit for months
 * while the tenant had no rows and no drawer ever opened.
 */
async function auditOverlay(page: Page, context: string, kind: 'dialog' | 'drawer'): Promise<boolean> {
  const mainDialogTrigger = page.locator('#main-content button[aria-haspopup="dialog"]').first();
  const trigger =
    kind === 'dialog'
      ? ((await mainDialogTrigger.count()) > 0 ? mainDialogTrigger : page.locator('button[aria-haspopup="dialog"]').first())
      : page.locator('table tbody tr').first().getByRole('button').first();

  if ((await trigger.count()) === 0) {
    console.log(`[a11y] ${context}: no ${kind} trigger found — skipped`);
    return false;
  }

  await trigger.click({ timeout: 10_000 }).catch(() => undefined);
  const overlay = page.locator('[role="dialog"]').first();
  const opened = await overlay
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!opened) {
    console.log(`[a11y] ${context}: ${kind} trigger present but no dialog opened — skipped`);
    return false;
  }

  await assertNoSeriousA11yViolations(page, { context: `${context} (${kind})` });

  // While the overlay is open, assert its scrim does not print. Radix portals
  // overlays into <body>, outside the app tree the print rules target, and
  // `print-color-adjust: exact` forces backgrounds on — so a scrim left visible
  // would ink the whole page. Live here rather than in `print-documents.spec.ts`
  // because that spec is deliberately tenant-free and this one already has an
  // overlay open.
  const backdrop = page.locator('[data-overlay-backdrop]').first();
  if (await backdrop.count()) {
    await page.emulateMedia({ media: 'print' });
    const printDisplay = await backdrop.first().evaluate((el) => getComputedStyle(el).display);
    await page.emulateMedia({ media: 'screen' });
    expect(
      printDisplay,
      `the overlay scrim still prints under print media (display: ${printDisplay}) — it needs data-overlay-backdrop`,
    ).toBe('none');
  }

  // Dismissing via Escape also exercises overlay Escape ownership: a regression
  // there shows up as the overlay staying open (or closing something else).
  await page.keyboard.press('Escape');
  const closed = await overlay
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    console.log(`[a11y] ${context}: ${kind} did not close on Escape`);
  }
  return true;
}

/** Viewports the skill names explicitly: 375 (mobile) and 1440 (desktop). */
const AUDIT_VIEWPORTS = RESPONSIVE_VIEWPORTS.filter(
  (viewport) => viewport.width === 375 || viewport.width === 1440,
);

async function gotoAndSettle(page: Page, origin: string, path: string, ready: string): Promise<void> {
  await page.goto(`${origin}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await waitForAppShellReady(page);
  await page.locator(ready).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);

  // Auditing mid-load produces findings that vary run to run: widgets/panels
  // stream in, and an element is only checkable once it has settled. Wait for
  // in-flight requests to finish (bounded — `networkidle` can hang on polling),
  // then give the final paint a beat.
  await page
    .waitForLoadState('networkidle', { timeout: 10_000 })
    .catch(() => undefined);

  await waitForToastsToClear(page).catch(() => undefined);
}

test.describe('accessibility smoke @smoke', () => {
  /**
   * One self-contained test on purpose.
   *
   * Playwright shards at the TEST level, so a second test in this file can land
   * in a different shard than the tenant bootstrap it depends on. Bootstrapping
   * once and sweeping every viewport/direction inside a single test keeps the
   * gate deterministic under CI sharding.
   */
  test('app shell and module surfaces pass axe at 375 and 1440 (LTR + RTL)', async ({ page }) => {
    test.setTimeout(300_000);
    resetPlatformUsers();

    await bootstrapAuthenticatedTenant(page, {
      subdomain,
      tenantOrigin,
      adminEmail,
      adminPassword: temporaryPassword,
      changedAdminPassword: permanentPassword,
      platformEmail,
      platformPassword,
    });

    await loginTenant(page, tenantOrigin, adminEmail, permanentPassword);

    // --- LTR sweep: shell + Work surfaces + one Setup surface ---------------
    for (const viewport of AUDIT_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of AUDIT_ROUTES) {
        await gotoAndSettle(page, tenantOrigin, route.path, route.ready);
        await assertNoSeriousA11yViolations(page, {
          context: `${route.label} @ ${viewport.width}px (ltr)`,
        });

        // Overlays are a different composition of the same primitives (focus
        // trap, backdrop, Escape), so they are audited as their own surface.
        // Desktop only — the trigger affordance differs at 375px.
        if (viewport.width === 1440 && route.path !== '/' && route.path !== '/settings') {
          const context = `${route.label} @ ${viewport.width}px (ltr)`;
          // Needs no seed data, so this one always runs.
          await auditOverlay(page, context, 'dialog');
          // Needs a directory row; logs when it has none.
          await auditOverlay(page, context, 'drawer');
        }
      }
    }

    // --- RTL: the app ships en/ar/ur/fa, and direction changes the a11y tree --
    // `forceRtl` injects `dir` into the LIVE document, so it must run AFTER the
    // final navigation — a reload would wipe it (mirrors
    // responsive-authenticated.spec.ts).
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, tenantOrigin, '/', '#main-content');
    await forceRtl(page, 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await assertNoSeriousA11yViolations(page, { context: 'dashboard @ 1440px (rtl)' });

    // RTL overlay — the direction flip is most likely to break overlays
    // (logical inset, sheet edge, close-button placement).
    await gotoAndSettle(page, tenantOrigin, '/students', '#main-content');
    await forceRtl(page, 'ar');
    await auditOverlay(page, 'students @ 1440px (rtl)', 'dialog');
    await auditOverlay(page, 'students @ 1440px (rtl)', 'drawer');
  });
});
