# ===================================================
# PowerShell Script สำหรับ Deploy ไปยัง Vercel
# ===================================================

param (
    [switch]$Production,
    [switch]$Preview,
    [switch]$Login
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🚀 ระบบจัดการการ Deploy Next.js ไปยัง Vercel" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

if ($Login) {
    Write-Host "🔐 กำลังเข้าสู่ระบบ Vercel CLI..." -ForegroundColor Yellow
    npx vercel login
    exit
}

if ($Production) {
    Write-Host "📌 โหมด: Production (--prod)" -ForegroundColor Yellow
    Write-Host "🔄 กำลังเริ่มกระบวนการ Deploy..." -ForegroundColor Cyan
    npx vercel --prod
}
elseif ($Preview) {
    Write-Host "📌 โหมด: Preview (Development)" -ForegroundColor Yellow
    Write-Host "🔄 กำลังเริ่มกระบวนการ Deploy..." -ForegroundColor Cyan
    npx vercel
}
else {
    Write-Host "กรุณาเลือกการทำงาน:" -ForegroundColor Yellow
    Write-Host " [1] Preview (สำหรับทดสอบ)" -ForegroundColor Cyan
    Write-Host " [2] Production (นำขึ้นจริง)" -ForegroundColor Green
    Write-Host " [L] Login (เข้าสู่ระบบ / รีเฟรช Token Vercel)" -ForegroundColor Magenta
    Write-Host " [Q] ยกเลิก" -ForegroundColor Gray
    
    $choice = Read-Host "เลือกตัวเลือก (1/2/L/Q)"

    switch ($choice.ToUpper()) {
        "1" {
            Write-Host "🚀 กำลัง Deploy ไปยัง Preview Environment..." -ForegroundColor Cyan
            npx vercel
        }
        "2" {
            Write-Host "🚀 กำลัง Deploy ไปยัง Production Environment..." -ForegroundColor Green
            npx vercel --prod
        }
        "L" {
            Write-Host "🔐 กำลังเข้าสู่ระบบ Vercel CLI..." -ForegroundColor Magenta
            npx vercel login
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Login สำเร็จเรียบร้อย! คุณสามารถเลือก Deploy ต่อได้ทันที:" -ForegroundColor Green
                Write-Host " [1] Deploy Preview" -ForegroundColor Cyan
                Write-Host " [2] Deploy Production" -ForegroundColor Green
                Write-Host " [Enter] ออกจากสคริปต์" -ForegroundColor Gray
                $deployAfterLogin = Read-Host "เลือกตัวเลือก (1/2)"
                if ($deployAfterLogin -eq "1") {
                    npx vercel
                } elseif ($deployAfterLogin -eq "2") {
                    npx vercel --prod
                }
            }
        }
        default {
            Write-Host "❌ ยกเลิกการทำงาน" -ForegroundColor Red
            exit
        }
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " 🎉 ดำเนินการสำเร็จเรียบร้อย!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ เกิดข้อผิดพลาด (Error Code: $LASTEXITCODE)" -ForegroundColor Red
}
