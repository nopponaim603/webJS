# ===================================================
# PowerShell Script สำหรับรัน Next.js GameDevJS Hub
# ตรวจสอบสภาพแวดล้อมอัตโนมัติ (Node, npm, dependencies, port)
# ===================================================

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🚀 กำลังเตรียมความพร้อมระบบ Next.js GameDevJS Hub..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# 1. ตรวจสอบ Node.js
Write-Host "🔍 [1/4] ตรวจสอบ Node.js..." -NoNewline
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host " [ไม่พบ]" -ForegroundColor Red
    Write-Host "❌ ข้อผิดพลาด: ไม่พบ Node.js ในระบบของคุณ" -ForegroundColor Red
    Write-Host "👉 กรุณาดาวน์โหลดและติดตั้ง Node.js ได้ที่: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = (& node -v).Trim()
Write-Host " [พบ: $nodeVersion]" -ForegroundColor Green

# 2. ตรวจสอบ npm
Write-Host "🔍 [2/4] ตรวจสอบ npm..." -NoNewline
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host " [ไม่พบ]" -ForegroundColor Red
    Write-Host "❌ ข้อผิดพลาด: ไม่พบคำสั่ง npm ในระบบ" -ForegroundColor Red
    exit 1
}
$npmVersion = (& npm -v).Trim()
Write-Host " [พบ: v$npmVersion]" -ForegroundColor Green

# 3. ตรวจสอบ dependencies (node_modules และ next)
Write-Host "🔍 [3/4] ตรวจสอบ dependencies และ Next.js..." -NoNewline
$nodeModulesPath = Join-Path $ProjectRoot "node_modules"
$nextPkgPath = Join-Path $ProjectRoot "node_modules\next"

$needInstall = $false
if (-not (Test-Path $nodeModulesPath)) {
    $needInstall = $true
    Write-Host " [ยังไม่ได้ติดตั้ง node_modules]" -ForegroundColor Yellow
} elseif (-not (Test-Path $nextPkgPath)) {
    $needInstall = $true
    Write-Host " [ไม่พบแพ็กเกจ Next.js]" -ForegroundColor Yellow
} else {
    Write-Host " [พร้อมใช้งาน]" -ForegroundColor Green
}

if ($needInstall) {
    Write-Host "📦 กำลังติดตั้ง dependencies อัตโนมัติด้วย 'npm install'..." -ForegroundColor Cyan
    Write-Host "⏳ ขั้นตอนนี้อาจใช้เวลาสักครู่..." -ForegroundColor DarkGray
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ การติดตั้ง dependencies ล้มเหลว (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "💡 กรุณาลองรัน 'npm install' ด้วยตนเองเพื่อตรวจสอบข้อผิดพลาด" -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
    Write-Host "✅ ติดตั้ง dependencies เรียบร้อยแล้ว!" -ForegroundColor Green
}

# 4. ตรวจสอบและจัดการ Port 3000
Write-Host "🔍 [4/4] ตรวจสอบพอร์ต 3000..." -NoNewline
try {
    $connections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    $port3000Process = if ($connections) { $connections | Select-Object -ExpandProperty OwningProcess -Unique } else { $null }
    $pidsToKill = if ($port3000Process) { $port3000Process | Where-Object { $_ -gt 4 } } else { $null }

    if ($pidsToKill) {
        Write-Host " [ตรวจพบ Process ใช้งานอยู่]" -ForegroundColor Yellow
        Write-Host "🔄 กำลังเคลียร์ Process เดิมที่ใช้งานพอร์ต 3000 (PID: $($pidsToKill -join ', '))..." -ForegroundColor DarkYellow
        $pidsToKill | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 800
    } else {
        Write-Host " [พอร์ตว่าง]" -ForegroundColor Green
    }
} catch {
    Write-Host " [ข้ามการตรวจสอบพอร์ต]" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🚀 เริ่มต้นรันเซิร์ฟเวอร์ Next.js GameDevJS Hub" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🌐 ระบบจะเปิดเบราว์เซอร์อัตโนมัติเมื่อเซิร์ฟเวอร์พร้อมที่: http://localhost:3000" -ForegroundColor Yellow
Write-Host "💡 กด Ctrl+C เพื่อหยุดการทำงานของเซิร์ฟเวอร์" -ForegroundColor DarkGray
Write-Host ""

# Job รอตรวจสอบเซิร์ฟเวอร์พร้อม แล้วจึงเปิด Browser
Start-Job -ScriptBlock {
    $url = "http://localhost:3000"
    $maxWaitSec = 30
    $waited = 0

    while ($waited -lt $maxWaitSec) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                break
            }
        } catch {
            # ยังไม่พร้อม รอรอบถัดไป
        }
    }
    Start-Process $url
} | Out-Null

# รัน Next.js Dev Server
npm run dev
