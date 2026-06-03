#!/usr/bin/env bash
# ================================================================
# MBG Dapur — Setup & Jalankan di Localhost
# Jalankan: bash setup-local.sh
# ================================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   MBG Dapur — Setup Lokal            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Cek Node.js
info "Cek Node.js..."
node_ver=$(node --version 2>/dev/null || echo "")
if [ -z "$node_ver" ]; then
  error "Node.js tidak ditemukan. Install dari https://nodejs.org (v20+)"
fi
ok "Node.js $node_ver"

# 2. Cek pnpm
info "Cek pnpm..."
if ! command -v pnpm &>/dev/null; then
  warn "pnpm tidak ditemukan. Install sekarang..."
  npm install -g pnpm
fi
ok "pnpm $(pnpm --version)"

# 3. Cek .env
info "Cek file .env..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo ""
    warn "File .env dibuat dari .env.example"
    warn "WAJIB edit .env dan isi DATABASE_URL dengan koneksi PostgreSQL Anda!"
    echo ""
    echo "  Contoh (PostgreSQL lokal):"
    echo "    DATABASE_URL=postgresql://postgres:password@localhost:5432/mbg_dapur"
    echo ""
    read -p "Sudah mengatur DATABASE_URL di .env? [y/N] " ans
    if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
      error "Harap isi DATABASE_URL di .env terlebih dahulu, lalu jalankan kembali script ini."
    fi
  else
    error "File .env tidak ditemukan. Buat file .env dengan DATABASE_URL."
  fi
else
  ok ".env ditemukan"
fi

# Load .env
export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true

# 4. Cek DATABASE_URL
info "Cek DATABASE_URL..."
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DATABASE_URL" ]; then
  error "DATABASE_URL atau SUPABASE_DATABASE_URL harus diisi di file .env"
fi
ok "Database URL ditemukan"

# 5. Install dependencies
info "Install dependencies (pnpm install)..."
pnpm install
ok "Dependencies terinstall"

# 6. Build API server
info "Build API server..."
pnpm --filter @workspace/api-server run build
ok "API server siap"

# 7. Push DB schema
info "Push schema database..."
echo ""
warn "Akan push schema ke database. Pastikan database PostgreSQL sudah berjalan."
read -p "Lanjutkan push schema? [y/N] " ans
if [[ "$ans" == "y" || "$ans" == "Y" ]]; then
  pnpm --filter @workspace/db run push
  ok "Schema database berhasil dipush"
else
  warn "Skip push schema. Pastikan schema sudah ada di database."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Setup selesai! Untuk menjalankan aplikasi:             ║"
echo "║                                                          ║"
echo "║   Terminal 1 (API Server):                               ║"
echo "║   $ bash start-api.sh                                    ║"
echo "║                                                          ║"
echo "║   Terminal 2 (Frontend):                                 ║"
echo "║   $ bash start-web.sh                                    ║"
echo "║                                                          ║"
echo "║   Buka browser: http://localhost:5173                    ║"
echo "║   Login: admin@test.com / admin123                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
