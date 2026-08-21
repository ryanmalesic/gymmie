# Kiro Web Sandbox Environment

## Runtime

- OS: Amazon Linux 2023 (inside a bubblewrap/bwrap sandbox with `--unshare-pid`)
- Node.js: available via nvm (`source /root/.nvm/nvm.sh && nvm use 22`) or via mise (node 24)
- Package manager: pnpm via corepack (`corepack pnpm`) or mise (`mise use pnpm@latest`)
- Task runner: just via mise (`mise use just@latest`), recipes defined in `justfile`

## Container Limitations

Podman 5.2.3 is installed and aliased as `docker`, but networking between host and containers is **broken** in this sandbox:

- `podman run -d` starts containers that show as "running" in `podman inspect`
- `podman logs` returns empty output for detached containers
- `podman exec` fails with "container is not running" even when inspect says otherwise
- `--network host` does not share the network namespace (127.0.0.1 is unreachable)
- Default bridge network assigns IPs (10.88.0.x) but ARP resolution fails
- Port-mapped containers (`-p 5432:5432`) result in "No route to host"
- Foreground containers (`podman run` without `-d`) DO execute and produce logs, but cannot provide network services since the host cannot connect to them

**Bottom line**: You cannot run database containers (PostgreSQL, etc.) in this sandbox and connect to them. Integration tests requiring a real database must be run in CI or locally.

## What Works

- `podman pull` (image downloading works)
- `podman run` in foreground (process executes, shows output)
- `podman build` (Dockerfile builds work)
- All non-container commands (node, pnpm, git, mise, just)

## Running Tests

- **Unit tests**: `just test` (no database needed)
- **Integration tests**: require `TEST_DATABASE_URL` pointing to a real PostgreSQL instance. Use CI or a local machine.
- **E2E tests**: require both `DATABASE_URL` and a running Next.js server. Use CI or local.

## Network Access

- External HTTPS works (package registries, GitHub, etc.)
- Localhost/loopback (127.0.0.1) only works for processes started directly on the host (not in containers)
- Container bridge IPs (10.88.0.x) are unreachable from the host due to broken ARP in the bwrap sandbox
