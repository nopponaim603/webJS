# User Story: US-01-portfolio - Game Portfolio Showcase System

**Status:** ✅ Done  
**Epic:** [Product Backlog](../01-product-backlog.md)  
**Owner:** Dev Team & AI Agent  

---

## 📖 Description

**ในฐานะ** ผู้เยี่ยมชมเว็บไซต์และผู้เล่นเกม  
**ฉันต้องการ** หน้าเว็บไซต์ Portfolio ที่แสดงรายการเกมทั้งหมดแบบ Glassmorphism Grid พร้อมระบบค้นหา จัดหมวดหมู่ และเปิดเล่นเกมใน Modal Iframe  
**เพื่อให้** สามารถเลือกเล่นเกม HTML5 ได้ทันทีในเบราว์เซอร์ สะดวก โหลดเร็ว และน่าประทับใจ  

---

## ✅ Acceptance Criteria

1. [x] แสดงผลการ์ดเกมในหน้าหลักอย่างครบถ้วนตามรายการใน `gamesData`
2. [x] รองรับการค้นหาตามชื่อเกมผ่าน Search input แบบ Real-time
3. [x] รองรับการกรองตาม Category (ปริศนา, ฟิสิกส์, จับคู่)
4. [x] เมื่อกดการ์ดเกม จะเปิด Modal Iframe โหลดไฟล์เกมพร้อมปรับ Aspect Ratio ให้เหมาะสม
5. [x] รองรับ Keyboard Shortcuts: `Space` (Pause/Resume), `F` (Fullscreen Toggle), `Esc` (Exit Modal)

---

## 🔗 Related Files

- Code: [script.js](../../../script.js), [index.html](../../../index.html), [styles.css](../../../styles.css)
- Backlog: [Product Backlog](../01-product-backlog.md)
- GDD Concept: [Game Concept & Architecture](../../gdd/00-concept.md)
