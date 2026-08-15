# ===================================================
# PowerShell Script สำหรับรัน Next.js Dev Server และเปิดหน้าเว็บอัตโนมัติ
# ===================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🚀 กำลังเริ่มต้นเซิร์ฟเวอร์ Next.js GameDevJS Hub..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# สร้าง Background Job เพื่อเปิด Browser หลังเซิร์ฟเวอร์เริ่มทำงาน (3 วินาที)
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "🌐 ระบบกำลังจะเปิดเบราว์เซอร์ที่: http://localhost:3000" -ForegroundColor Yellow
Write-Host "💡 กด Ctrl+C เพื่อหยุดการทำงานของเซิร์ฟเวอร์" -ForegroundColor DarkGray
Write-Host ""

# ตรวจสอบและเคลียร์ Process ที่ค้างอยู่ที่ Port 3000 ก่อนเริ่มเซิร์ฟเวอร์
$port3000Process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port3000Process) {
    Write-Host "🔄 กำลังเคลียร์ Process เดิมที่ใช้งานพอร์ต 3000 (PID: $($port3000Process -join ', '))..." -ForegroundColor DarkYellow
    $port3000Process | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500
}

# รัน Next.js Dev Server
npm run dev
