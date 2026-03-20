#!/usr/bin/env bash
# setup.sh — Install, test, and build the Car Catalogue project (Unix/macOS)
set -e

echo "========================================"
echo "  Car Catalogue — Project Setup"
echo "========================================"

# 1. Check Node is available
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -e "process.exit(parseInt(process.versions.node) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
if [ "$NODE_VERSION" = "old" ]; then
  echo "WARNING: Node.js 18+ is recommended. Current: $(node --version)"
fi

# 2. Install dependencies (prefer pnpm, fall back to npm)
echo ""
echo ">> Installing dependencies..."
if command -v pnpm &>/dev/null; then
  pnpm install
else
  npm install
fi

# 3. Run tests
echo ""
echo ">> Running tests..."
if command -v pnpm &>/dev/null; then
  pnpm test
else
  npm test
fi

# 4. Build
echo ""
echo ">> Building for production..."
if command -v pnpm &>/dev/null; then
  pnpm run build
else
  npm run build
fi

echo ""
echo "========================================"
echo "  Setup complete!"
echo "  To start the dev server: npm run dev"
echo "  To start production:     npm run start"
echo "========================================"
