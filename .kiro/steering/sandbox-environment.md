# Kiro Web Sandbox Environment

## Runtime

- OS: Amazon Linux 2023 (inside a bubblewrap/bwrap sandbox with `--unshare-pid`)
- Node.js: available via nvm (`source /root/.nvm/nvm.sh && nvm use 22`) or via mise (node 24)
- Package manager: pnpm via corepack (`corepack pnpm`) or mise (`mise use pnpm@latest`)
- Task runner: just via mise (`mise use just@latest`), recipes defined in `justfile`

## Container Limitations

Podman 5.2.3 is installed and aliased as `docker`, but networking between host and containers is **broken** in this sandbox:

- Containers start but host cannot connect to them (127.0.0.1 unreachable)
- `--network host` does not share the network namespace
- Bridge network IPs (10.88.0.x) have broken ARP resolution
- Port-mapped containers (`-p 5432:5432`) result in "No route to host"

**Bottom line**: You cannot run database containers and connect to them in this sandbox.

## Working Solution: embedded-postgres

The `embedded-postgres` npm package spawns a real PostgreSQL binary as a child process directly from Node.js. This bypasses container networking entirely.

- Package: `embedded-postgres` (devDependency)
- Requires `createPostgresUser: true` since we run as root
- Uses port 5555 (integration tests) and 5556 (e2e tests)
- Data stored in `.tmp/` (gitignored, non-persistent)
- The scripts automatically start/stop the database

## Running Commands

Always prefix node/pnpm commands with:

```bash
source /root/.nvm/nvm.sh && nvm use 22 >/dev/null
```

All project commands are wrapped in `just` recipes (see `justfile`). Use `just --list` to see available recipes.

Key recipes:

- `just setup` - install deps + generate prisma client
- `just build` - build the project
- `just lint` - run eslint
- `just typecheck` - run tsc --noEmit
- `just test` - run unit tests
- `just test-integration` - run integration tests (uses embedded-postgres, no external DB needed)
- `just e2e-chromium` - run e2e tests with chromium (uses embedded-postgres)
- `just verify` - full pre-commit check (format, lint, typecheck, unit test)
- `just verify-all` - verify + integration tests

## Running Tests

- **Unit tests**: `just test` or `corepack pnpm test:unit -- --run` (no database needed)
- **Integration tests**: `just test-integration` or `corepack pnpm test:integration` (embedded-postgres starts automatically)
- **Integration with external DB**: `just test-integration-external postgresql://user:pass@host:port/db`
- **E2E tests**: `just e2e-chromium` or `corepack pnpm exec playwright test --project=chromium` (embedded-postgres starts in global-setup)
- **Full verification**: `just verify` (format, lint, typecheck, unit tests)

## Git Commits in This Sandbox

The mise pnpm shim has a broken `libatomic.so.1` dependency. When committing, remove mise shims from PATH:

```bash
source /root/.nvm/nvm.sh && nvm use 22 >/dev/null
PATH=$(echo "$PATH" | tr ':' '\n' | grep -v mise | tr '\n' ':') git commit -m "your message"
```

This ensures husky pre-commit hooks use nvm's pnpm (via corepack) instead of the broken mise shim.

## Network Access

- External HTTPS works (package registries, GitHub, etc.)
- Localhost/loopback (127.0.0.1) works for processes started directly on the host (including embedded-postgres)
- Container networking is broken (see Container Limitations above)
