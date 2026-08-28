import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";
import fs from "node:fs";
import path from "node:path";

const requireTestRule = {
  create(context) {
    const filename = context.filename;
    if (!filename || filename === "<text>" || filename === "<input>") {
      return {};
    }

    if (
      filename.endsWith(".test.ts") ||
      filename.endsWith(".test.tsx") ||
      filename.endsWith(".integration.test.ts") ||
      filename.endsWith(".integration.test.tsx") ||
      filename.endsWith(".spec.ts") ||
      filename.endsWith(".spec.tsx")
    ) {
      return {};
    }

    if (
      filename.endsWith(".d.ts") ||
      filename.includes(".config.") ||
      filename.endsWith("proxy.ts") ||
      filename.includes("vitest.") ||
      filename.includes("test/") ||
      filename.includes("lib/generated/") ||
      filename.includes("components/ui/") ||
      filename.includes("scripts/")
    ) {
      return {};
    }

    const ext = path.extname(filename);
    if (ext !== ".ts" && ext !== ".tsx") {
      return {};
    }

    const dir = path.dirname(filename);
    const baseName = path.basename(filename, ext);

    const testCandidates = [
      path.join(dir, `${baseName}.test.ts`),
      path.join(dir, `${baseName}.test.tsx`),
      path.join(dir, `${baseName}.integration.test.ts`),
      path.join(dir, `${baseName}.integration.test.tsx`),
    ];

    const hasTest = testCandidates.some((candidate) =>
      fs.existsSync(candidate),
    );

    if (!hasTest) {
      return {
        Program(node) {
          context.report({
            data: {
              basename: path.basename(filename),
              expected: `${baseName}.test.${ext === ".tsx" ? "tsx" : "ts"}`,
            },
            messageId: "missingTest",
            node,
          });
        },
      };
    }

    return {};
  },
  meta: {
    docs: {
      description:
        "Enforce that every source file has a corresponding test file",
    },
    messages: {
      missingTest:
        "Source file '{{basename}}' is missing a corresponding test file (expected '{{expected}}').",
    },
    type: "problem",
  },
};

const localPlugin = {
  rules: {
    "require-test": requireTestRule,
  },
};

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
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/require-test": "error",
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
          paths: [
            ...testOnlyPaths,
            {
              message: "Cannot import directly from @/app root.",
              name: "@/app",
            },
            {
              message: "Cannot import directly from app root.",
              name: "app",
            },
          ],
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: [
                "@/app/api/**",
                "@/app/\\(*\\)/**",
                "app/api/**",
                "app/\\(*\\)/**",
              ],
              message: "components cannot import routes from app.",
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
          paths: [
            ...testOnlyPaths,
            {
              message: "Cannot import directly from @/app root.",
              name: "@/app",
            },
            {
              message: "Cannot import directly from app root.",
              name: "app",
            },
          ],
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: [
                "@/app/api/**",
                "@/app/\\(*\\)/**",
                "app/api/**",
                "app/\\(*\\)/**",
              ],
              message: "lib cannot import routes from app.",
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
            {
              group: ["@/hooks", "@/hooks/**", "hooks", "hooks/**"],
              message: "lib cannot import from hooks.",
            },
            {
              group: [
                "@/domain",
                "@/domain/*",
                "@/domain/**",
                "domain/*",
                "domain/**",
              ],
              message: "lib cannot import from domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...testOnlyPaths,
            {
              message: "domain cannot import from app.",
              name: "@/app",
            },
            {
              message: "domain cannot import from app.",
              name: "app",
            },
          ],
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: ["@/app", "@/app/**", "app", "app/**"],
              message: "domain cannot import from app.",
            },
            {
              group: ["@/hooks", "@/hooks/**", "hooks", "hooks/**"],
              message: "domain cannot import from hooks.",
            },
            {
              group: [
                "@/components",
                "@/components/**",
                "components",
                "components/**",
              ],
              message: "domain cannot import from components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...testOnlyPaths,
            {
              message: "hooks cannot import directly from @/app root.",
              name: "@/app",
            },
            {
              message: "hooks cannot import directly from app root.",
              name: "app",
            },
          ],
          patterns: [
            relativeImports,
            testHelpers,
            {
              group: [
                "@/app/api/**",
                "@/app/\\(*\\)/**",
                "app/api/**",
                "app/\\(*\\)/**",
              ],
              message: "hooks cannot import routes from app.",
            },
            {
              group: [
                "@/components",
                "@/components/**",
                "components",
                "components/**",
              ],
              message: "hooks cannot import from components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.integration.test.{ts,tsx}",
      "test/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [relativeImports],
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
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
