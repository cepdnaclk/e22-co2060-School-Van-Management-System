#!/usr/bin/env bash
set -euo pipefail

echo "=== Building KidsRoute Combined Deployment ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"

# Clean previous build
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# 1. Build the marketing website
echo ""
echo "--- Building marketing website (code/website) ---"
cd "$ROOT_DIR/code/website"
npm install
npm run build
echo "✓ Marketing website built"

# 2. Build the portal frontend
echo ""
echo "--- Building portal frontend (code/frontend) ---"
cd "$ROOT_DIR/code/frontend"
npm install
npm run build
echo "✓ Portal frontend built"

# 3. Merge into single dist/
echo ""
echo "--- Merging builds into dist/ ---"

# Copy marketing website to dist root
cp -r "$ROOT_DIR/code/website/dist/"* "$DIST_DIR/"
echo "  Copied marketing website → dist/"

# Copy portal frontend to dist/portal/
mkdir -p "$DIST_DIR/portal"
cp -r "$ROOT_DIR/code/frontend/dist/"* "$DIST_DIR/portal/"
echo "  Copied portal frontend  → dist/portal/"

echo ""
echo "=== Build complete ==="
echo "  dist/           → Marketing website"
echo "  dist/portal/    → Portal frontend"
ls -la "$DIST_DIR"
