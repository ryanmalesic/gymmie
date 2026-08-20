# Repo Conventions

This project is a Next.js 16 app using the App Router. The following tools and conventions apply.

## Package Manager — pnpm

- Use `pnpm` for all package operations (`pnpm add`, `pnpm install`, `pnpm run`, etc.). Never use npm or yarn.
- The lockfile is `pnpm-lock.yaml`. Do not delete or regenerate it without reason.
- `pnpm-workspace.yaml` exists at the root; respect its `allowBuilds` configuration.
- Pin the packageManager field in `package.json` — currently `pnpm@11.22.0`.

## Next.js 16

- This project uses **Next.js 16** with the App Router (`app/` directory). Do not use the Pages Router.
- The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`). Do not add `"use memo"` or manual `useMemo`/`useCallback` unless profiling shows the compiler misses an optimization.
- Before writing or modifying Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. APIs and conventions may differ from your training data.
- Use the `@/*` path alias (mapped to the project root) for imports.

## TypeScript

- Strict mode is enabled. Do not loosen it (`strict: true` in `tsconfig.json`).
- Prefer explicit return types on exported functions and component props interfaces.
- Use `type` imports (`import type { ... }`) when importing only types.
- Do not use `any`. Use `unknown` and narrow, or define a proper type.
- The type-check command is `pnpm tsc --noEmit`.

## ESLint

- Config lives in `eslint.config.mjs` (flat config format).
- Active rule sets: `next/core-web-vitals`, `next/typescript`, `eslint-plugin-perfectionist` (natural sort), and `eslint-config-prettier`.
- `eslint-plugin-perfectionist` enforces natural ordering of imports, object keys, types, etc. Follow its ordering — do not disable or override it.
- Run with `pnpm lint` (which calls `eslint`). To auto-fix: `pnpm eslint --fix`.

## Prettier

- Config lives in `.prettierrc`.
- Key settings: `printWidth: 100`, `singleQuote: true`, `semi: true`, `trailingComma: "es5"`, `tabWidth: 2`, `endOfLine: "lf"`.
- The `prettier-plugin-tailwindcss` plugin is active — it auto-sorts Tailwind classes. Do not manually reorder class strings.
- Run with `pnpm prettier --write <files>` or `pnpm prettier --check .` to verify.

## Husky + lint-staged

- Husky v8 runs a pre-commit hook (`.husky/pre-commit`) that calls `pnpm lint-staged`.
- lint-staged config (in `package.json`):
  - `*.{js,jsx,ts,tsx}` → `eslint --fix` then `prettier --write`
  - `*.{json,md,css,scss}` → `prettier --write`
- Before committing, replicate this locally: run `pnpm eslint --fix` and `pnpm prettier --write` on changed files, then verify with `pnpm lint` and `pnpm prettier --check .`.
- Never skip the pre-commit hook (`--no-verify`) unless the user explicitly asks.

## Git Commits

- **Always sign commits**: use `git commit -S`. Never create an unsigned commit.
- This applies to all commits — initial, amend, merge, etc.

## Pre-commit Verification Order

Run these before every commit:

1. `pnpm prettier --write <changed files>` — format
2. `pnpm eslint --fix` — lint and auto-fix
3. `pnpm tsc --noEmit` — type-check
4. `pnpm build` — ensure the project builds cleanly
5. `git commit -S` — sign the commit
