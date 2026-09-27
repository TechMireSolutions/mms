# Frontend reuse audit

Date: 2026-09-27

## Scope and conclusion

Reviewed platform/tenant shell composition, navigation state, semantic accents,
branding token ownership, and representative UI/data boundaries. This is a targeted
architecture audit and first refactor, not an exhaustive review of every feature.

The existing shared AppShell and ModuleCommandMetricsGrid are useful composition
boundaries. Extend them through slots and data props. Platform authentication,
tenant permissions, queries, locale decisions, and branding loading belong in host
adapters. Sharing their rendered chrome does not require sharing those policies.

## Findings and changes

| Priority | Finding | Result |
| --- | --- | --- |
| Medium | Tenant AppLayout and PlatformSidebarContext separately owned the same navigation transitions. | Both use `hooks/useNavigationState.ts`; its return type defines the state API. Platform injects persistence; tenant defaults remain per mount. |
| Medium | Card stripes and stat icons maintained separate accent aliases and fallback rules. Legacy utility strings could yield mismatched colors. | `lib/accentTone.ts` owns aliases and normalization. Both token maps derive aliases from it; regression tests check parity. |
| Low | AppShell duplicated every slot declaration from NavigationAdapter. | AppShellProps extends NavigationAdapter. Existing direct props and adapter precedence remain compatible. |
| High | Shared UI includes tenant data orchestration. Examples: UserActorSelect reads auth and tenant users; RegistryPersonSelect queries students/faculty; reports/useFacultyReportController imports tenant collections. | Remaining boundary debt. Stage migration by extracting prop-driven views and retaining data controllers in tenant adapters. |
| Medium | `lib/brandingThemeCore.ts` imports platform defaults. Generic DOM application and platform boot policy share a module. | Remaining dependency inversion opportunity: move boot entry policy to host adapters while retaining `applyBrandingFromSettings` as shared behavior. |
| Medium | Accent component APIs accept arbitrary strings; substring interpretation is legacy compatibility. | Preserved compatibility in one resolver. Advisory next step: migrate callers to AccentName and then narrow public props. |

## Ownership map

- `packages/shared`: pure branding calculations, DTOs, domain types. Existing
  `buildBrandingCssVariables` remains the source of runtime branding values.
- `index.css`: semantic HSL mappings, layout dimensions, typography and theme tokens.
- `lib/accentTone.ts`: semantic accent names and legacy aliases, not tenant colors.
- `components/ui` and `components/common`: reusable rendering and composition slots.
- `hooks/useNavigationState.ts`: navigation transitions; no identity, query, or storage access.
- Platform/tenant adapters: authentication, query orchestration, persistence policy,
  locale selection, permissions and host-specific content.

## Advisory migration sequence

1. Extract searchable-select presentation from UserActorSelect and RegistryPersonSelect.
   Pass options, selected label, search value, loading/error state and callbacks.
   Keep pagination, identity defaults and endpoint selection in tenant controllers.
2. Move report data controllers out of the UI primitive tree. Share report rendering
   using typed datasets and action slots; avoid tenant IDs or host flags in views.
3. Add an import-boundary ratchet with an explicit baseline for existing violations,
   then reduce that baseline with each adapter migration. Existing broad violations
   make a blanket ban disruptive; this audit does not claim that ban is enforced.
4. Separate branding boot adapters, retaining the shared HSL generator and existing
   locale/font helpers. Verify switching host/theme does not retain prior tokens.

## Compatibility and verification

Navigation persistence retains `mms_platform_sidebar_collapsed`. Mobile and palette
state stay independent across mounted consumers. No server query keys, session
logic, tenant authorization or endpoint contracts changed.

The accent change intentionally makes stripes follow the same normalization as
stat icons for uppercase and legacy utility strings. Unknown names fall back to
primary; absent stripe accents remain empty. No palette values changed.

Automated coverage includes provider/tenant state isolation, functional toggles,
unavailable browser storage, all accent aliases and safe unknown-name fallback.

Validation: repository typecheck and frontend lint passed. The frontend suite
passed 767 files / 2,712 tests; a focused run passed 45 tests. The full run logged
sandbox-blocked localhost requests in existing tests despite passing. The seeded
axe suite was not run because its bootstrap resets platform users; authenticated
keyboard/focus and locale-specific visual checks remain unverified.

Public responsive verification: all 22 Chromium checks passed at 375, 768 and
1440 pixels, including forced RTL, overflow and touch-target checks. The initial
sandbox run could not open the backend IPC socket; the approved retry outside
the sandbox passed. These public routes do not establish authenticated shell
accessibility or actual Arabic/Urdu/Persian typography coverage.
