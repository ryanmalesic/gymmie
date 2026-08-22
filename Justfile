# Run `just` to list recipes.

export DATABASE_URL := env_var_or_default("DATABASE_URL", "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable")
export SHADOW_DATABASE_URL := env_var_or_default("SHADOW_DATABASE_URL", "postgres://postgres:postgres@localhost:51215/template1?sslmode=disable")

default:
    @just --list

# Install dependencies
install:
    pnpm install

# Start local Postgres (if needed) and the Next.js dev server
dev:
    bash scripts/dev.sh

# Production build
build:
    pnpm build

# Start the production server
start:
    pnpm start

# Lint and autofix
lint:
    pnpm lint

# Write formatting fixes
format:
    pnpm format

# Lint, format, and production build
check:
    pnpm check

# Run unit and integration tests
test:
    bash scripts/test.sh

# Run unit tests only
test-unit:
    pnpm exec vitest run --project unit

# Run unit tests in watch mode
test-watch:
    pnpm test:watch

# Run integration tests against the test database
test-integration:
    bash scripts/test.sh --project integration

# Run Playwright e2e tests
e2e:
    bash scripts/e2e.sh

# Install Playwright browsers into playwright-core/.local-browsers
e2e-install:
    PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright install --with-deps chromium

# Open the Playwright UI
e2e-ui:
    bash scripts/e2e.sh --ui
