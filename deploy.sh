#!/bin/bash
# ===================================================
# Shell Script สำหรับ Deploy ไปยัง Vercel (Linux / macOS / Git Bash)
# ===================================================

echo "=================================================="
echo " 🚀 กำลังเตรียม Deploy Next.js ไปยัง Vercel..."
echo "=================================================="

if [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
    echo "📌 โหมด: Production (--prod)"
    npx vercel --prod
elif [ "$1" == "--preview" ]; then
    echo "📌 โหมด: Preview (Development)"
    npx vercel
else
    echo "กรุณาเลือกประเภทการ Deploy:"
    echo " [1] Preview (สำหรับทดสอบ)"
    echo " [2] Production (นำขึ้นจริง)"
    echo " [Q] ยกเลิก"
    read -p "เลือกตัวเลือก (1/2/Q): " choice

    case "$choice" in
        1)
            echo "🚀 กำลัง Deploy ไปยัง Preview Environment..."
            npx vercel
            ;;
        2)
            echo "🚀 กำลัง Deploy ไปยัง Production Environment..."
            npx vercel --prod
            ;;
        *)
            echo "❌ ยกเลิกการ Deploy"
            exit 0
            ;;
    esac
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo " 🎉 Deploy สำเร็จเรียบร้อย!"
    echo "=================================================="
else
    echo ""
    echo "❌ เกิดข้อผิดพลาดในการ Deploy"
fi
