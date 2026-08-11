# HealthMate AI — single-command launcher for Windows PowerShell
# Run this from the healthmate-ai/ folder (the one containing backend/ and frontend/):
#   .\start.ps1

$root = $PSScriptRoot

Write-Host "Starting HealthMate AI backend (FastAPI, port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$root\backend`"; uvicorn app.main:app --reload --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "Starting HealthMate AI frontend (Vite, port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$root\frontend`"; npm run dev"
)

Write-Host ""
Write-Host "Two new PowerShell windows just opened:" -ForegroundColor Green
Write-Host "  1) Backend  -> http://localhost:8000/docs"
Write-Host "  2) Frontend -> http://localhost:5173"
Write-Host ""
Write-Host "Close those windows (or Ctrl+C inside them) to stop each server."
