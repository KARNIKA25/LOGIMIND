# ============================================================
# LOGIMIND v2 — Local Development Startup Script (PowerShell)
# ============================================================

try {
    $Host.UI.RawUI.WindowTitle = "LOGIMIND v2 Launcher"
} catch {
    # Ignore if not interactive console
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LOGIMIND v2 - AI-Powered Logistics Intelligence Platform" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$pythonExe = "C:\Users\karnika\AppData\Local\Python\bin\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

$nodeDir = "C:\Users\karnika\AppData\Local\Programs\nodejs\node-v22.23.3-win-x64"
$pythonDir = "C:\Users\karnika\AppData\Local\Python\bin"

if (Test-Path $nodeDir) {
    $env:Path = $nodeDir + ";" + $pythonDir + ";" + $env:Path
}

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = (Get-Location).Path
}

Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$backendCmd = "`$env:Path = '$nodeDir;$pythonDir;' + `$env:Path; Set-Location '$scriptDir\backend'; & '$pythonExe' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontendCmd = "`$env:Path = '$nodeDir;$pythonDir;' + `$env:Path; Set-Location '$scriptDir\frontend'; npm run dev"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "All services launched successfully!" -ForegroundColor Green
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "Frontend Portal:  http://localhost:5173" -ForegroundColor White
Write-Host "Demo Credentials: admin@logimind.ai / LogiMind@2026" -ForegroundColor Cyan

