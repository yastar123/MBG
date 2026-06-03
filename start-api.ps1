# Jalankan API Server di localhost:3001
$ErrorActionPreference = "Stop"

if (Test-Path .env) {
    Write-Output "▶ Memulai API server di port 3001..."
    node --env-file=.env --enable-source-maps artifacts/api-server/dist/index.mjs
} else {
    Write-Output "[ERROR] File .env tidak ditemukan!"
    exit 1
}
