---
title: "System Test Guideline — webJS Game Portfolio"
version: "1.0.0"
last_updated: "2026-07-26"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - wiki
  - guidelines
---

# System Test Guideline — webJS Game Portfolio

**Last Updated:** 2026-07-26 | **Version:** 1.0.0

---

## 🎯 Purpose & Scope

เอกสารฉบับนี้กำหนด มาตรฐานขั้นตอนการทดสอบ (Test Checklist) สำหรับระบบ Game Portfolio `webJS` เพื่อให้มั่นใจว่าทุกฟีเจอร์ โค้ด HTML/CSS/JS และตัวมินิเกมทำงานได้อย่างถูกต้อง ปราศจาก Error บนหน้าจอเบราว์เซอร์

---

## 🧪 Test Checklist

### 1. Portfolio Page Verification (`index.html` & `script.js`)
- [ ] โหลดหน้าเว็บหลักขึ้นมา การ์ดเกมแสดงผลครบถ้วน
- [ ] รูปภาพปกและ Gradient บนการ์ดเกมโหลดได้สมบูรณ์ ไม่แตก
- [ ] ค้นหาเกมใน Search bar ได้ตรงตามคำค้นหา
- [ ] กดปุ่ม Category Filter แล้วการ์ดเกมเปลี่ยนตามหมวดที่เลือก

### 2. Modal & Iframe Verification
- [ ] คลิกการ์ดเกม แล้ว Modal Iframe เปิดขึ้นมาตรงกลางหน้าจอ
- [ ] ตัวเกมใน Iframe โหลดและเล่นได้ลื่นไหล
- [ ] กดปุ่ม `Esc` หรือปุ่ม Close เพื่อปิด Modal ได้
- [ ] กดปุ่ม `F` เพื่อเข้า/ออกจากโหมด Fullscreen ได้
- [ ] กดปุ่ม `Space` เพื่อสั่ง Pause/Resume ตัวเกมได้

### 3. Server Verification (`server.js`)
- [ ] รัน `npm start` หรือ `node server.js`
- [ ] เซิร์ฟเวอร์ส่งคืน MIME types สอดคล้องกับนามสกุลไฟล์ (.html, .css, .js)
- [ ] ปราศจาก 404/500 HTTP errors บน Browser Console

---

## Related Documents
- Test Reports: [System Test Reports](../../agile/05-report-backlog.md)
- Knowledge Wiki: [Project Wiki](../wiki.md)
