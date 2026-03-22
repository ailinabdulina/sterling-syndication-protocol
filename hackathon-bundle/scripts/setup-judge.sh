#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "[!] .env not found. Create it first: cp .env.example .env"
  exit 1
fi

if ! command -v mcporter >/dev/null 2>&1; then
  echo "[!] mcporter is required (see RUNBOOK.md)"
  exit 1
fi

echo "[1/4] Installing dependencies..."
npm install

echo "[2/4] Registering local WDK MCP server in project config..."
mcporter config remove wdk >/dev/null 2>&1 || true
mcporter config add wdk \
  --command node \
  --arg "$ROOT_DIR/scripts/wdk-mcp-server.mjs" \
  --scope project >/dev/null

echo "[3/4] Verifying MCP tools..."
mcporter list wdk --schema --json >/dev/null

echo "[4/4] Setup complete. Next commands:"
echo "  npm run syndicate:check"
echo "  node setup-wallets.mjs"
echo "  npm start"
