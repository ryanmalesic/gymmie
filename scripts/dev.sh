#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR
# shellcheck source=ensure-test-db.sh
source "${script_dir}/ensure-test-db.sh"

ensure_test_db
pnpm dev "$@"
