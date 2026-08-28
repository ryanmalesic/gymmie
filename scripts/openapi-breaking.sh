#!/usr/bin/env bash
set -euo pipefail

# Local equivalent of oasdiff/oasdiff-action/breaking@main
# (see .github/workflows/openapi.yml). Compares lib/openapi.yaml against
# the git base spec (origin/main, then main, then HEAD).
# Optional first arg: git ref to use as the base.

spec="lib/openapi.yaml"
# Pin to the version currently used by oasdiff/oasdiff-action/breaking@main.
oasdiff_version="1.29.1"
image="tufin/oasdiff:v${oasdiff_version}"
if [[ "${1:-}" == "--" ]]; then
  shift
fi
base_ref="${1:-}"
download_dir=""

cleanup() {
  if [[ -n "$download_dir" ]]; then
    rm -rf "$download_dir"
  fi
}
trap cleanup EXIT

if [[ ! -f "$spec" ]]; then
  echo "error: ${spec} not found" >&2
  exit 1
fi

if [[ -z "$base_ref" ]]; then
  if git rev-parse --verify --quiet origin/main >/dev/null; then
    base_ref="origin/main"
  elif git rev-parse --verify --quiet main >/dev/null; then
    base_ref="main"
  else
    base_ref="HEAD"
  fi
fi

cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/gymmie/oasdiff/${oasdiff_version}"
cached_bin="${cache_dir}/oasdiff"

install_oasdiff() {
  local os arch asset url
  os="$(uname -s)"
  arch="$(uname -m)"
  case "${os}-${arch}" in
    Darwin-*) asset="oasdiff_${oasdiff_version}_darwin_all.tar.gz" ;;
    Linux-x86_64) asset="oasdiff_${oasdiff_version}_linux_amd64.tar.gz" ;;
    Linux-aarch64 | Linux-arm64) asset="oasdiff_${oasdiff_version}_linux_arm64.tar.gz" ;;
    *) return 1 ;;
  esac

  url="https://github.com/oasdiff/oasdiff/releases/download/v${oasdiff_version}/${asset}"
  download_dir="$(mktemp -d)"
  echo "downloading oasdiff v${oasdiff_version}..." >&2
  curl -fsSL "$url" | tar -xz -C "$download_dir"
  mkdir -p "$cache_dir"
  mv "$download_dir/oasdiff" "$cached_bin"
  chmod +x "$cached_bin"
}

resolve_oasdiff() {
  if command -v oasdiff >/dev/null 2>&1; then
    command -v oasdiff
    return
  fi
  if [[ -x "$cached_bin" ]]; then
    echo "$cached_bin"
    return
  fi
  if install_oasdiff && [[ -x "$cached_bin" ]]; then
    echo "$cached_bin"
    return
  fi
  return 1
}

echo "oasdiff breaking: ${base_ref}:${spec} -> ${spec}"

if oasdiff_bin="$(resolve_oasdiff)"; then
  "$oasdiff_bin" breaking "${base_ref}:${spec}" "$spec"
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker run --rm -t \
    -v "$(pwd):/specs" \
    -w /specs \
    "${image}" \
    breaking "${base_ref}:${spec}" "${spec}"
else
  echo "error: install oasdiff (brew install oasdiff) or start Docker Desktop to use ${image}" >&2
  exit 1
fi
