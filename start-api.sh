#!/usr/bin/env bash
# Jalankan API Server di localhost:8080
set -e

# Load .env jika ada
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
fi

if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "[ERROR] DATABASE_URL atau SUPABASE_DATABASE_URL harus diisi di file .env"
  exit 1
fi

echo "▶ Memulai API server di port 8080..."
echo "  Database: ${SUPABASE_DATABASE_URL:+Supabase}${DATABASE_URL:+Local PostgreSQL}"
echo ""

PORT=8080 NODE_ENV=development node --enable-source-maps artifacts/api-server/dist/index.mjs
