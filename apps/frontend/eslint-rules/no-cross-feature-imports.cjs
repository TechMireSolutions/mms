/**
 * MMS FE boundary rule — importer-aware cross-feature import ban.
 *
 * Files inside `src/tenant/features/{module}/**` may not import from another
 * feature module's internals (`@/tenant/features/{other}/**`). Cross-module
 * hooks/data go through `@/tenant/hooks/collections/*` facades; shared chrome
 * lives in `components/ui` / `lib/` / `@mms/shared`. `reports` and `settings`
 * are sanctioned cross-cutting feature targets (report chrome, app settings).
 *
 * Core `no-restricted-imports` cannot express this because it matches only the
 * import source, not the importing file — intra-module imports would also match.
 */
const FEATURE_FILE = /src[/\\]tenant[/\\]features[/\\]([^/\\]+)[/\\]/;
const FEATURE_TARGET = /^@[/\\]tenant[/\\]features[/\\]([^/\\]+)(?:[/\\]|$)/;
const SHARED_FEATURES = new Set(["reports", "settings"]);

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Bans direct imports between tenant feature modules",
    },
    messages: {
      crossFeature:
        "`{{from}}` may not import `@/tenant/features/{{target}}/...` directly (features are isolated). Route hooks/data through `@/tenant/hooks/collections/*`, or extract shared chrome to `components/ui` / logic to `lib/` / `@mms/shared`.",
    },
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, "/");
    const selfModule = FEATURE_FILE.exec(filename)?.[1];
    if (!selfModule) return {};

    const check = (node, source) => {
      if (typeof source !== "string") return;
      const target = FEATURE_TARGET.exec(source)?.[1];
      if (target && target !== selfModule && !SHARED_FEATURES.has(target)) {
        context.report({
          node,
          messageId: "crossFeature",
          data: { from: selfModule, target },
        });
      }
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source && node.source.type === "Literal") {
          check(node, node.source.value);
        }
      },
    };
  },
};
