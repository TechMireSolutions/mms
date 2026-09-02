/**
 * MMS BiDi Design System Rule — Enforce logical CSS properties.
 *
 * Disallows physical directional Tailwind utilities (pl-*, pr-*, ml-*, mr-*,
 * text-left, text-right, border-l-*, border-r-*, rounded-l-*, rounded-r-*)
 * and mandates BiDi logical equivalents (ps-*, pe-*, ms-*, me-*, text-start,
 * text-end, border-s-*, border-e-*, rounded-s-*, rounded-e-*).
 */
const PHYSICAL_DIRECTIONAL_PATTERN =
  /\b(?:(?:after:|before:)?(left|right)-(?:\d+(?:\/\d+)?|full|auto|px)|(text-(?:left|right))|((?:p|m)[lr]-(?:\d+(?:\.\d+)?|auto|px))|((?:border|rounded)-[lr](?:-[a-zA-Z0-9_/]+)?))\b/g;

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforces logical CSS utility classes over physical directional ones for BiDi compatibility",
    },
    messages: {
      useLogicalClass:
        "Physical directional class `{{className}}` is banned in MMS. Use logical equivalent (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `text-end`, `border-s-*`, `border-e-*`).",
    },
  },
  create(context) {
    function checkStringLiteral(node, value) {
      if (typeof value !== "string") return;
      let match;
      PHYSICAL_DIRECTIONAL_PATTERN.lastIndex = 0;
      while ((match = PHYSICAL_DIRECTIONAL_PATTERN.exec(value)) !== null) {
        context.report({
          node,
          messageId: "useLogicalClass",
          data: { className: match[0] },
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === "className") {
          if (node.value && node.value.type === "Literal") {
            checkStringLiteral(node.value, node.value.value);
          } else if (
            node.value &&
            node.value.type === "JSXExpressionContainer" &&
            node.value.expression &&
            node.value.expression.type === "Literal"
          ) {
            checkStringLiteral(node.value.expression, node.value.expression.value);
          } else if (
            node.value &&
            node.value.type === "JSXExpressionContainer" &&
            node.value.expression &&
            node.value.expression.type === "TemplateLiteral"
          ) {
            for (const quasi of node.value.expression.quasis) {
              checkStringLiteral(quasi, quasi.value.raw);
            }
          }
        }
      },
    };
  },
};
