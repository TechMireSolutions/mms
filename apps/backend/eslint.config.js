import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  {
    files: ["src/**/*.ts"],
    extends: [pluginJs.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          "prefer": "type-imports",
          "fixStyle": "inline-type-imports",
          "disallowTypeAnnotations": false,
        },
      ],
      // Type-aware rules: catch unhandled/misused promises (real bug sources).
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
);
