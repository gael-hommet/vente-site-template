import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "public/**",
    "input/assets/**",
  ]),
  {
    rules: {
      // Allow deliberate unused vars prefixed with underscore (adapter stubs,
      // ref params in wrappers, etc.).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Node utility scripts (asset pipeline, audits): CLI conventions differ from
    // app code — concise ternary-as-statement reporting is intentional here.
    files: ["scripts/**/*.mjs"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
]);

export default eslintConfig;
