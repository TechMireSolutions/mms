import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const appFiles = [
  "src/components/**/*.{ts,tsx}",
  "src/pages/**/*.{ts,tsx}",
  "src/hooks/**/*.{ts,tsx}",
  "src/lib/**/*.{ts,tsx}",
  "src/providers/**/*.{ts,tsx}",
  "src/tenant/**/*.{ts,tsx}",
  "src/platform/**/*.{ts,tsx}",
  "src/common/**/*.{ts,tsx}",
];

export default tseslint.config(
  {
    ignores: ["dist/**", "src/components/ui/**"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: appFiles,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "19.2" },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-useless-assignment": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\bbg-white\\b/]",
          message: "Prefer bg-card or SURFACE tokens over bg-white.",
        },
        {
          selector: "Literal[value=/text-\\[#/]",
          message: "Prefer semantic text tokens over arbitrary hex in className.",
        },
        {
          selector: "Literal[value=/#ef4444|#047857|#f59e0b/]",
          message: "Use branding palette or semanticTone tokens instead of hardcoded hex.",
        },
      ],
    },
  },
);
