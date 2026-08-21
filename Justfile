# Run `just` to list recipes.

default:
    @just --list

# Install dependencies
install:
    pnpm install

# Start the Next.js dev server
dev:
    pnpm dev

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

# Run unit tests once
test:
    pnpm test

# Run unit tests in watch mode
test-watch:
    pnpm test:watch

# Run Playwright e2e tests
e2e:
    pnpm e2e

# Install Playwright browsers into playwright-core/.local-browsers
e2e-install:
    PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright install --with-deps chromium

# Open the Playwright UI
e2e-ui:
    pnpm e2e:ui
