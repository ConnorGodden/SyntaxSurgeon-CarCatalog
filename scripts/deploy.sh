#!/usr/bin/env bash
# deploy.sh — Run pre-deploy checks and deploy to Vercel
set -e

echo "========================================"
echo "  Car Catalogue — Deploy to Vercel"
echo "========================================"

# 1. Make sure we're on the main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "WARNING: You are deploying from branch '$BRANCH', not 'main'."
  read -rp "Continue anyway? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# 2. Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: You have uncommitted changes. Please commit or stash them before deploying."
  exit 1
fi

# 3. Install dependencies
echo ""
echo ">> Installing dependencies..."
if command -v pnpm &>/dev/null; then pnpm install; else npm install; fi

# 4. Run tests — abort if any fail
echo ""
echo ">> Running tests..."
if command -v pnpm &>/dev/null; then pnpm test; else npm test; fi

# 5. Production build
echo ""
echo ">> Building for production..."
if command -v pnpm &>/dev/null; then pnpm run build; else npm run build; fi

# 6. Deploy via Vercel CLI
echo ""
echo ">> Deploying to Vercel..."
if ! command -v vercel &>/dev/null; then
  echo "Vercel CLI not found — installing globally..."
  npm install -g vercel
fi
vercel --prod

echo ""
echo "========================================"
echo "  Deployment complete!"
echo "  Live at: https://cars.connor12858.ca"
echo "========================================"
