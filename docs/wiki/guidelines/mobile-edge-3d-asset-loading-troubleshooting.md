# 📱 3D Asset Loading & Mobile Edge Troubleshooting Guide

**Document ID:** `GUIDE-3D-ASSET-01`  
**Category:** Technical Troubleshooting & Best Practices  
**Engine:** Babylon.js 7.x (Next.js / HTML5 Browser Games)  
**Last Updated:** 2026-07-29 | **Version:** 1.22.0  
**Author:** Antigravity AI & Dev Team  

---

## 🎯 Overview & Problem Statement

เมื่อนำเกม 3D Platformer (`Babylon.js`) ไปเปิดใช้งานบน **Microsoft Edge Mobile** หรือ **Cross-Platform Mobile WebViews** ภายใน Iframe/Modal มักพบปัญหาโมเดล 3D ไม่แสดงผล หรือตัวละครตกร่วงตายตลอดเวลา เนื่องจากระบบไม่สามารถดาวน์โหลดไฟล์ไบนารี 3D (`.glb`) มาแสดงผลได้ และจำใจสลับไปรันในโหมด **Procedural Geometry Fallback Mode** (รูปกล่อง/แคปซูลสำรอง)

คู่มือนี้สรุปบทเรียนและประเด็นการแก้ไขเชิงสถาปัตยกรรม (Root Cause Resolution) ทั้งหมดเพื่อเป็นมาตรฐานองค์ความรู้ในทีม

---

## 🔍 Root Cause Analysis (วิเคราะห์สาเหตุที่แท้จริง)

```
[Mobile Edge Browser / Iframe Container]
           │
           ├── 1. Path Resolution Bug (HTTP 404)
           │      └── URL ขาด trailing slash ทำให้ ../../assets/ ย้อนขึ้นผิดชั้น
           │
           ├── 2. Babylon.js 7.x Plugin Mismatch
           │      └── ต้องการ BABYLON.GLTF2.GLTFFileLoader (ต่างจาก v6.x)
           │
           ├── 3. Empty Mesh Child Cloning Trap
           │      └── tempRoot.setEnabled(false) + clone(false) ได้ TransformNode เปล่า
           │
           └── 4. Silent Failure & Lack of Diagnostics
                  └── ไม่ทราบสาเหตุที่แท้จริงจนกระทั่งมี Live Error Code Banner
```

### 1. HTTP 404 Iframe Path Resolution Failure (`ERR-E02`)
- **สาเหตุ**: เมื่อเกมถูกรันใน Iframe/Modal ของ Next.js ค่า `window.location.href` ของ Iframe บางครั้งไม่มีสแลช (`/`) ปิดท้าย (เช่น `http://domain.com/games/3d-platformer`)
- **ผลกระทบ**: คำสั่ง `new URL('../../assets/...', window.location.href)` จะคำนวณพาทเพี้ยนไปที่ `/games/assets/` ซึ่งไม่มีอยู่จริงบนเซิร์ฟเวอร์ ส่งผลให้ตอบกลับเป็น **HTTP 404 Not Found**

### 2. Babylon.js 7.x Plugin Namespace Mismatch (`ERR-E01`)
- **สาเหตุ**: ใน Babylon.js v7.x ปลั๊กอินอ่านไฟล์ GLTF 2.0 ถูกย้ายไปที่ **`BABYLON.GLTF2.GLTFFileLoader`**
- **ผลกระทบ**: หากเช็คเพียง `BABYLON.GLTFFileLoader` เอนจินจะมองไม่เห็นปลั๊กอิน และปฏิเสธการอ่านไฟล์ `.glb` อย่างเงียบๆ (Silent Failure)

### 3. Empty Mesh Child Clone Trap
- **สาเหตุ**: การใช้ `ImportMeshAsync` แบบมี `tempRoot.setEnabled(false)` แล้วสั่ง `tempRoot.clone(name, null, false)`
- **ผลกระทบ**: พารามิเตอร์ `doNotCloneChildren = false` บน Babylon.js 7.x ที่แม่โดน disabled จะส่งผลให้ได้ **TransformNode เปล่าๆ ที่ไม่มี Mesh ลูกอยู่ข้างในเลย**

---

## 🛠️ Architectural Solutions & Implementation

### 1. Self-Contained Local Asset Mirroring
ทำสำเนาโฟลเดอร์โมเดล 3D (`.glb`) ทั้งหมดไว้ภายในโฟลเดอร์ของตัวเองโดยตรง เพื่อไม่ให้พึ่งพาการคำนวณย้อนกลับไปที่ Domain Root:
- **Location**: `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/`

### 2. Multi-Path Candidate Fallback Pipeline
จัดลำดับ Candidate Paths ในการโหลดไฟล์โดยให้สิทธิ์ Local Game Asset ก่อนเสมอ:
```javascript
const candidates = [
    // 1. Local Game Assets Directory (Guaranteed inside game folder)
    './assets/kenney-starter-kit-3d-platformer/models/',
    'assets/kenney-starter-kit-3d-platformer/models/',
    
    // 2. Absolute Path from Domain Root for Local Assets
    '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/',

    // 3. Absolute Path from Domain Root for Global Assets
    '/assets/kenney-starter-kit-3d-platformer/models/',

    // 4. Origin URL Resolved Paths
    origin + '/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/',
    origin + '/assets/kenney-starter-kit-3d-platformer/models/',

    // 5. Computed Relative Paths
    '../../assets/kenney-starter-kit-3d-platformer/models/'
].filter(Boolean);
```

### 3. Dynamic GLTF / GLTF2 Loader Verification
ลงทะเบียนปลั๊กอินทั้งสอง Namespace สำหรับ Babylon.js 7.x:
```javascript
function ensureGLTFLoader() {
    if (typeof BABYLON !== 'undefined' && BABYLON.SceneLoader) {
        if (BABYLON.SceneLoader.IsPluginForExtensionAvailable && BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
            return true;
        }
        if (BABYLON.GLTF2 && BABYLON.GLTF2.GLTFFileLoader) {
            BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTF2.GLTFFileLoader());
            return true;
        }
        if (BABYLON.GLTFFileLoader) {
            BABYLON.SceneLoader.RegisterPlugin(new BABYLON.GLTFFileLoader());
            return true;
        }
    }
    return true;
}
```

### 4. Live Diagnostic Error Code Taxonomy System
พัฒนาระบบรหัสแจ้งเตือนข้อผิดพลาด 5 หมวดหมู่บน Popup Banner เพื่อให้ผู้ทดสอบทราบสาเหตุยามเกิดปัญหาทันที:

| Error Code | Meaning | Resolution Path |
| :--- | :--- | :--- |
| **`E01: NO_GLTF_PLUGIN`** | ไม่พบปลั๊กอิน GLTF Loader | เช็คการโหลด `babylonjs.loaders.min.js` |
| **`E02: HTTP_404_PATH`** | หาไฟล์ `.glb` ไม่พบ | ตรวจสอบ Local Assets Mirror และ Candidate Paths |
| **`E03: CORS_BLOCK`** | ติดปัญหา Security Policy | ตรวจสอบ Headers ใน `next.config.js` & `server.js` |
| **`E04: FETCH_NETWORK_FAIL`** | เครือข่ายล้มเหลว/Data Saver | ตรวจสอบสัญญาณเครือข่าย หรือ Offline Service Worker |
| **`E05: GLTF_PARSE_FAIL`** | ถอดรหัสไฟล์ GLB ไม่สำเร็จ | ตรวจสอบว่าไฟล์ GLB ไม่สมบูรณ์ หรือ WebGL Context มีปัญหา |

---

## 🎨 Asset Status Popup UI Overlay

```javascript
function showAssetStatusPopup(isFallback, errorCode, errorMsg) {
    ...
    if (isFallback) {
        popup.style.background = 'rgba(239, 68, 68, 0.92)';
        popup.innerHTML = `⚙️ Fallback Geometry [${errorCode || 'E02: 404_NOT_FOUND'}]`;
    } else {
        popup.style.background = 'rgba(16, 185, 129, 0.92)';
        popup.innerHTML = '🎉 Real Kenney 3D Models Loaded';
    }
    ...
}
```

---

## 📋 Best Practices & Developer Checklist

- [x] **Self-Contained Assets**: ทุกเกมที่พัฒนาแยกเดี่ยว ควรมีโฟลเดอร์ Assets ประจำตัวใน `./assets/`
- [x] **Babylon 7.x Support**: ต้องเช็คทั้ง `BABYLON.GLTF2.GLTFFileLoader` และ `BABYLON.GLTFFileLoader`
- [x] **No Premature Revoke**: ห้ามเรียก `URL.revokeObjectURL` ทันทีหลัง `LoadAssetContainerAsync`
- [x] **Live Diagnostic Banner**: ต้องมี UI Banner แจ้งเตือนสถานะการรันโมเดล (Real vs Fallback Mode) พร้อม Error Code เสมอ

---
*Document Maintained in webJS Knowledge Base Wiki.*
