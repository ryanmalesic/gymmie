#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=ensure-test-db.sh
source "${script_dir}/ensure-test-db.sh"

if [[ -n "${CI:-}" ]]; then
  PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright install --with-deps chromium
fi

ensure_test_db
PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright test "$@"
