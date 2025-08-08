#!/usr/bin/env bash
set -euo pipefail

# Build the WASM binary in release mode and copy it to the web public folder
# Requirements: 'swiftly' with the WASM SDK installed (see sdk-install.sh)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_DIR="$REPO_ROOT/public"

# Allow overriding the SDK via env var, otherwise use the pinned snapshot
: "${SWIFT_WASM_SDK:=swift-6.2-DEVELOPMENT-SNAPSHOT-2025-08-01-a_wasm}"

echo "==> Building Listen (release, wasm32-wasi) using SDK: $SWIFT_WASM_SDK"
cd "$SCRIPT_DIR"

# Clean build dir if requested
if [[ "${1:-}" == "clean" ]]; then
  rm -rf .build
fi

# Build release for WASI
swiftly run swift \
  build \
  -c release \
  --triple wasm32-unknown-wasip1 \
  --swift-sdk "$SWIFT_WASM_SDK" \
  --static-swift-stdlib \
  -v

ARTIFACT="$SCRIPT_DIR/.build/wasm32-unknown-wasip1/release/Listen.wasm"
if [[ ! -f "$ARTIFACT" ]]; then
  echo "ERROR: Built artifact not found: $ARTIFACT" >&2
  exit 1
fi

mkdir -p "$PUBLIC_DIR"
cp -f "$ARTIFACT" "$PUBLIC_DIR/Listen.wasm"

BYTES=$(stat -f%z "$PUBLIC_DIR/Listen.wasm" 2>/dev/null || stat -c%s "$PUBLIC_DIR/Listen.wasm" 2>/dev/null || echo "?")
echo "==> Copied to $PUBLIC_DIR/Listen.wasm ($BYTES bytes)"
echo "Done."