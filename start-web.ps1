# Jalankan Frontend di localhost:5173
$ErrorActionPreference = "Stop"

$env:BASE_PATH="/"
Write-Output "▶ Memulai frontend di http://localhost:5173 ..."
pnpm --filter @workspace/mbg-dapur run dev
