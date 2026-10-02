import { expect, test, type Page } from '@playwright/test';
import { assertNoSeriousA11yViolations } from '../helpers/a11y.js';
import { auditOverlay } from '../helpers/a11yOverlay.js';
import { loginTenant } from '../helpers/moduleTiers.js';
import {
  RESPONSIVE_VIEWPORTS,
  forceRtl,
  waitForAppShellReady,
  waitForToastsToClear,
} from '../helpers/responsive.js';
import {
  bootstrapAuthenticatedTenant,
  ensureE2ePlatformAdmin,
} from '../helpers/tenantBootstrap.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

const subdomain = `a11y${Date.now()}`;
const tenantOrigin = `http://${subdomain}.localhost:5173`;
const adminEmail = `admin@${subdomain}.com`;
const temporaryPassword = 'Madrasa@1234';
const permanentPassword = 'Madrasa@5678';
const platformEmail = `platform-a11y-${Date.now()}@test.com`;
const platformPassword = 'Pa$$w0rd123';

/**
 * Shell + representative Work/Setup surfaces under accessibility smoke audit.
 */
const AUDIT_ROUTES = [
  { path: '/', ready: '#main-content', label: 'dashboard (shell)' },
  { path: '/contacts', ready: '#main-content', label: 'contacts (Work)' },
  { path: '/students', ready: '#main-content', label: 'students (Work, dense table)' },
  { path: '/finance', ready: '#main-content', label: 'finance (Work, money)' },
  { path: '/accounting', ready: '#main-content', label: 'accounting (Work, ledger)' },
  { path: '/settings', ready: '#main-content', label: 'settings (Setup)' },
];

const AUDIT_VIEWPORTS = RESPONSIVE_VIEWPORTS.filter(
  (viewport) => viewport.width === 375 || viewport.width === 1440,
);

async function gotoAndSettle(page: Page, origin: string, path: string, ready: string): Promise<void> {
  await page.goto(`${origin}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await waitForAppShellReady(page);
  await page.locator(ready).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
  await waitForToastsToClear(page).catch(() => undefined);
  await page.locator('[aria-busy="true"]').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(400);
}

test.describe('accessibility smoke @smoke', () => {
  test('app shell and module surfaces pass axe at 375 and 1440 (LTR + RTL)', async ({ page }) => {
    test.setTimeout(300_000);

    await test.step('Bootstrap authenticated tenant session', async () => {
      ensureE2ePlatformAdmin(platformEmail, platformPassword);
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
    });

    // --- LTR sweep: shell + Work surfaces + Setup surface ---------------
    for (const viewport of AUDIT_VIEWPORTS) {
      await test.step(`LTR Sweep @ ${viewport.width}px (${viewport.name})`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const route of AUDIT_ROUTES) {
          await test.step(`Audit ${route.label} @ ${viewport.width}px`, async () => {
            await gotoAndSettle(page, tenantOrigin, route.path, route.ready);
            await assertNoSeriousA11yViolations(page, {
              context: `${route.label} @ ${viewport.width}px (ltr)`,
            });

            // Command Palette (Desktop & Mobile)
            if (route.path === '/') {
              await test.step(`Audit Command Palette @ ${viewport.width}px`, async () => {
                await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
                const palette = page.locator('[role="dialog"][aria-label*="Search" i], [role="dialog"][aria-label*="Command" i]').first();
                const opened = await palette.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
                if (opened) {
                  await assertNoSeriousA11yViolations(page, {
                    context: `Command Palette @ ${viewport.width}px (ltr)`,
                  });
                  await page.keyboard.press('Escape');
                  await palette.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
                }
              });
            }

            // Overlays: Dialogs & Drawers/FormModals (Desktop only)
            if (viewport.width === 1440 && route.path !== '/' && route.path !== '/settings') {
              const context = `${route.label} @ ${viewport.width}px (ltr)`;
              await auditOverlay(page, context, 'dialog');
              await auditOverlay(page, context, 'drawer');
            }
          });
        }
      });
    }

    // --- RTL sweep: verify layout, direction, and overlays ----------------
    await test.step('RTL Sweep @ 1440px', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoAndSettle(page, tenantOrigin, '/', '#main-content');
      await forceRtl(page, 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await assertNoSeriousA11yViolations(page, { context: 'dashboard @ 1440px (rtl)' });

      // RTL Command Palette verification
      await test.step('Audit Command Palette @ 1440px (rtl)', async () => {
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
        const palette = page.locator('[role="dialog"][aria-label*="Search" i], [role="dialog"][aria-label*="Command" i]').first();
        const opened = await palette.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
        if (opened) {
          await assertNoSeriousA11yViolations(page, {
            context: 'Command Palette @ 1440px (rtl)',
          });
          await page.keyboard.press('Escape');
          await palette.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
        }
      });

      // RTL overlay verification on dense work directory
      await gotoAndSettle(page, tenantOrigin, '/students', '#main-content');
      await forceRtl(page, 'ar');
      await auditOverlay(page, 'students @ 1440px (rtl)', 'dialog');
      await auditOverlay(page, 'students @ 1440px (rtl)', 'drawer');
    });
  });
});
