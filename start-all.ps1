# Jalankan API Server dan Frontend bersamaan
$ErrorActionPreference = "Stop"

Write-Output "▶ Menjalankan MBG Dapur..."
Write-Output "▶ Memulai API Server di jendela baru..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node --env-file=.env --enable-source-maps artifacts/api-server/dist/index.mjs"

Write-Output "▶ Memulai Frontend..."
$env:BASE_PATH="/"
pnpm --filter @workspace/mbg-dapur run dev
