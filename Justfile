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
