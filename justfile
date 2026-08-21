# gymmie development commands
# run `just --list` to see all available recipes

set dotenv-load := false

# default recipe shows available commands
default:
    @just --list

# install dependencies
install:
    pnpm install

# generate prisma client
prisma-generate:
    pnpm prisma:generate

# run prisma migrations in dev mode
prisma-migrate-dev *args:
    pnpm prisma:migrate:dev {{args}}

# deploy prisma migrations (production / CI)
prisma-migrate-deploy:
    pnpm prisma:migrate:deploy

# open prisma studio
prisma-studio:
    pnpm prisma:studio

# start dev server
dev:
    pnpm dev

# build the project
build:
    pnpm build

# start production server
start:
    pnpm start

# run eslint
lint:
    pnpm lint

# format code with prettier
format *args:
    pnpm exec prettier --write {{args}}

# format all files
format-all:
    pnpm exec prettier --write .

# typecheck with tsc
typecheck:
    pnpm exec tsc --noEmit

# run all unit tests
test:
    pnpm test:unit

# run unit tests in watch mode
test-watch:
    pnpm test:watch

# run tests with coverage
test-coverage:
    pnpm test:coverage

# start the test database (tries docker compose, falls back to podman)
test-db-start:
    ./scripts/start-test-db.sh

# stop the test database
test-db-stop:
    podman rm -f gymmie-test-db 2>/dev/null || docker compose -f compose.test.yml down 2>/dev/null || true

# run integration tests (requires TEST_DATABASE_URL)
test-integration:
    pnpm test:integration

# run integration tests with local test database
test-integration-local: test-db-start
    TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gymmie_test pnpm test:integration

# run playwright e2e tests
e2e *args:
    pnpm e2e {{args}}

# run the full verification suite (format, lint, typecheck, test)
verify:
    just format-all
    just lint
    just typecheck
    just test

# setup project from scratch
setup:
    just install
    just prisma-generate
