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

# รัน Next.js Dev Server
npm run dev
