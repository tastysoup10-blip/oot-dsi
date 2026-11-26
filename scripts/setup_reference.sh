#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(pwd)"
REFERENCE_DIR="$(dirname "$WORKSPACE_ROOT")/oot-reference"

if [ -d "$REFERENCE_DIR/.git" ]; then
  echo "Reference checkout already exists: $REFERENCE_DIR"
else
  echo "Cloning ZeldaRET/oot beside this project..."
  git clone --depth 1 https://github.com/zeldaret/oot.git "$REFERENCE_DIR"
fi

echo
echo "Upstream reference revision:"
git -C "$REFERENCE_DIR" rev-parse HEAD
echo
python3 scripts/inspect_reference.py "$REFERENCE_DIR"
