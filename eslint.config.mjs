import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";

const relativeImports = {
  group: ["./*", "../*"],
  message: "Use the @/ alias instead of relative imports.",
};

const testHelpers = {
  group: ["@/test/*", "@/test/**", "test/*", "test/**"],
  message: "Test helpers cannot be imported from application code.",
};

const testOnlyPaths = [
  {
    message:
      "resetDatabase is test-only and cannot be imported from application code.",
    name: "@/test/reset-database",
  },
  {
    message:
      "resetDatabase is test-only and cannot be imported from application code.",
    name: "test/reset-database",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  perfectionist.configs["recommended-natural"],
  prettier,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [relativeImports],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: testOnlyPaths,
          patterns: [relativeImports, testHelpers],
        },
      ],
    },
  },
  {
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: testOnlyPaths,
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: ["@/app", "@/app/*", "@/app/**", "app/*", "app/**"],
              message: "components cannot import from app.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: testOnlyPaths,
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: ["@/app", "@/app/*", "@/app/**", "app/*", "app/**"],
              message: "lib cannot import from app.",
            },
            {
              group: [
                "@/components",
                "@/components/*",
                "@/components/**",
                "components/*",
                "components/**",
              ],
              message: "lib cannot import from components.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "lib/prisma/generated/**",
  ]),
]);

export default eslintConfig;
