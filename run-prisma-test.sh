#!/usr/bin/env bash
set -euo pipefail

echo "===== Checking Node version ====="
node -v

echo "===== Installing dependencies ====="
npm install

echo "===== Generating Prisma client ====="
npm run db:generate

echo "===== Running availability test ====="
npm run test:availability
