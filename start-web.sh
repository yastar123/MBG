#!/usr/bin/env bash
# Jalankan Frontend di localhost:5173
set -e

echo "▶ Memulai frontend di http://localhost:5173 ..."
echo "  API proxy → http://localhost:8080"
echo ""

BASE_PATH=/ pnpm --filter @workspace/mbg-dapur run dev
