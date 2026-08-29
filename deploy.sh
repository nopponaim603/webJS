#!/bin/bash
# ===================================================
# Shell Script สำหรับ Deploy ไปยัง Vercel (Linux / macOS / Git Bash)
# ===================================================

echo "=================================================="
echo " 🚀 ระบบจัดการการ Deploy Next.js ไปยัง Vercel"
echo "=================================================="

if [ "$1" == "--login" ] || [ "$1" == "-l" ]; then
    echo "🔐 กำลังเข้าสู่ระบบ Vercel CLI..."
    npx vercel login
    exit 0
elif [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
    echo "📌 โหมด: Production (--prod)"
    npx vercel --prod
elif [ "$1" == "--preview" ]; then
    echo "📌 โหมด: Preview (Development)"
    npx vercel
else
    echo "กรุณาเลือกการทำงาน:"
    echo " [1] Preview (สำหรับทดสอบ)"
    echo " [2] Production (นำขึ้นจริง)"
    echo " [L] Login (เข้าสู่ระบบ / รีเฟรช Token Vercel)"
    echo " [Q] ยกเลิก"
    read -p "เลือกตัวเลือก (1/2/L/Q): " choice

    case "${choice^^}" in
        1)
            echo "🚀 กำลัง Deploy ไปยัง Preview Environment..."
            npx vercel
            ;;
        2)
            echo "🚀 กำลัง Deploy ไปยัง Production Environment..."
            npx vercel --prod
            ;;
        L)
            echo "🔐 กำลังเข้าสู่ระบบ Vercel CLI..."
            npx vercel login
            ;;
        *)
            echo "❌ ยกเลิกการทำงาน"
            exit 0
            ;;
    esac
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo " 🎉 ดำเนินการสำเร็จเรียบร้อย!"
    echo "=================================================="
else
    echo ""
    echo "❌ เกิดข้อผิดพลาด"
fi
