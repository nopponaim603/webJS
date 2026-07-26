# ===================================================
# PowerShell Script สำหรับ Deploy ไปยัง Vercel
# ===================================================

param (
    [switch]$Production,
    [switch]$Preview
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🚀 กำลังเตรียม Deploy Next.js ไปยัง Vercel..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

if ($Production) {
    Write-Host "📌 โหมด: Production (--prod)" -ForegroundColor Yellow
    Write-Host "🔄 กำลังเริ่มกระบวนการ Deploy..." -ForegroundColor LightCyan
    npx vercel --prod
}
elseif ($Preview) {
    Write-Host "📌 โหมด: Preview (Development)" -ForegroundColor Yellow
    Write-Host "🔄 กำลังเริ่มกระบวนการ Deploy..." -ForegroundColor LightCyan
    npx vercel
}
else {
    Write-Host "กรุณาเลือกประเภทการ Deploy:" -ForegroundColor Yellow
    Write-Host " [1] Preview (สำหรับทดสอบ)" -ForegroundColor Cyan
    Write-Host " [2] Production (นำขึ้นจริง)" -ForegroundColor Green
    Write-Host " [Q] ยกเลิก" -ForegroundColor Gray
    
    $choice = Read-Host "เลือกตัวเลือก (1/2/Q)"

    switch ($choice) {
        "1" {
            Write-Host "🚀 กำลัง Deploy ไปยัง Preview Environment..." -ForegroundColor LightCyan
            npx vercel
        }
        "2" {
            Write-Host "🚀 กำลัง Deploy ไปยัง Production Environment..." -ForegroundColor LightGreen
            npx vercel --prod
        }
        default {
            Write-Host "❌ ยกเลิกการ Deploy" -ForegroundColor Red
            exit
        }
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " 🎉 Deploy สำเร็จเรียบร้อย!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ เกิดข้อผิดพลาดในการ Deploy (Error Code: $LASTEXITCODE)" -ForegroundColor Red
}
