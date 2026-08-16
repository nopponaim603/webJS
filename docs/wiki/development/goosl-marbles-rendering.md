---
title: "🔮 Goosl Glass Marbles — WebGL 2 Shader & Physics Rendering Knowledge Base"
version: "1.0.0"
last_updated: "2026-07-29"
owner: "Antigravity AI & Dev Team"
status: "Active"
tags:
  - wiki
---

# 🔮 Goosl Glass Marbles — WebGL 2 Shader & Physics Rendering Knowledge Base

**Game Code:** `goosl-marbles` (G016)  
**Primary Source File:** [public/games/goosl-marbles/app.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/goosl-marbles/app.js)  
**Tech Stack:** WebGL 2, Custom GLSL ES 3.0 Shaders, Web Audio API, Fixed 120Hz Sub-stepping Physics  
**Last Updated:** 2026-07-29  
**Author:** Antigravity AI & Dev Team  

---

## 1. Executive Summary

เอกสารฉบับนี้จัดทำขึ้นเพื่อถอดองค์ความรู้และสถาปัตยกรรมการเรนเดอร์เชิงลึกของเกม **Goosl Glass Marbles (`goosl-marbles`)** ซึ่งเป็นหนึ่งในเกมที่โดดเด่นที่สุดในด้านความสวยงามของกราฟิกลูกแก้ว 3 มิติ ความสมจริงของการหักเหแสง ความเงาวาวระยิบระยับ และความลื่นไหลระดับ 60–120 FPS บนอุปกรณ์หลากหลายประเภท

---

## 2. WebGL 2 Procedural Ray-Marched Shader Pipeline

แทนที่จะใช้โมเดล 3 มิติประเภท High-Poly Triangles ซึ่งกินทรัพยากรกราฟิกสูง ตัวเกมใช้ **Procedural Ray-Marched Quad Engine (Single-Pass Instanced Shader)** บน WebGL 2 เพื่อวาดลูกแก้วคมชัดระดับพิกเซล

```
+-----------------------------------------------------------------------+
|                         Instanced Quad (2D)                           |
|  +-----------------------------------------------------------------+  |
|  |  Analytical Normal -> z = sqrt(1 - r^2) -> 3D Normal Vector N   |  |
|  |  Quaternion Matrix  -> Transform 3D Rotation for Rolling Spin   |  |
|  |  Optical Refraction -> Dispersion Split (Red: 1.17, Blue: 0.82)  |  |
|  |  Cat's Eye Ribbon   -> Ray-Plane Intersection + Beer-Lambert    |  |
|  |  Specular Specular  -> Dual Specular + Window Glint + Scratches |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

### 2.1 Analytical Normal & Depth Calculation (สมการทรงกลมสมบูรณ์)
- สำหรับพิกเซลทุกพิกเซลบน Quad 2D (`aLocal`), Shader คำนวณความลึกแกน Z ของทรงกลมโดยตรง:
  $$z = \sqrt{\max(0.0, 1.0 - (x^2 + y^2))}$$
- สร้างเวกเตอร์ Normal 3D $\vec{N} = \text{normalize}(x, y, z)$ ประจำพิกเซลอย่างเที่ยงตรง ขอบของลูกแก้วจึงโค้งมน นวลเนียน โดยไม่มีรอยเหลี่ยมของ โพลีกอน (Zero Polygon Aliasing)

```glsl
// Fragment Shader Excerpt (marbleFragment)
float r2 = dot(vLocal, vLocal);
float z = sqrt(max(0.0, 1.0 - r2));
vec3 normal = normalize(vec3(vLocal, z));
```

---

### 2.2 Multi-Chromatic Dispersion Refraction (การหักเหแสงและสีปริซึม)
- **Optical Refraction Displacement**: คำนวณพิกเซลหักเหตามความลึกและการโค้งของแก้ว `refractOffset = normal.xy * bend * (0.72 + vRadius * 0.16)`
- **Chromatic Dispersion**: สุ่มอ่านค่าสี Red, Green, และ Blue จาก Framebuffer ทับซ้อนด้วยดรรชนีหักเหที่ต่างกันเล็กน้อย (`redDispersion = 1.17`, `blueDispersion = 0.82`) เกิดรุ้งแสงปริซึมที่ขอบลูกแก้วอย่างสมจริง

```glsl
refracted.r = texture(uScene, screenUv - refractOffset * redDispersion + microRefraction * 1.16).r;
refracted.g = texture(uScene, screenUv - refractOffset + microRefraction).g;
refracted.b = texture(uScene, screenUv - refractOffset * blueDispersion + microRefraction * 0.78).b;
```

---

### 2.3 Quaternion 3D Rotation Matrix (การหมุนตามฟิสิกส์ 3 มิติแท้)
- ลูกแก้วทุกดวงเก็บค่าทิศทางการหมุน 3D เป็น **Quaternion** (`aRotation`)
- เมื่อลูกแก้วกลิ้งไปตามพื้น เวกเตอร์ความเร็วหมุน (Angular Velocity) จะอัปเดต Quaternion และแปลงเป็น 3x3 Rotation Matrix ใน Shader ทำให้ลวดลายพัดภายในและรอยขีดข่วนบนผิว **หมุนตามการกลิ้งในมิติ 3D สมจริง**

```glsl
mat3 objectToWorld = quaternionToMatrix(vRotation);
mat3 worldToObject = transpose(objectToWorld);
vec3 surfacePoint = worldToObject * vec3(vLocal, z);
```

---

### 2.4 Cat's Eye Internal Ribbon Vane (ลวดลายพัดในเนื้อแก้ว)
- ใช้เทคนิค Ray-Plane Intersection คำนวณจุดตัดของลำแสงภายในเนื้อแก้ว (`rayBase + rayDirection * hitZ`)
- วาดลวดลายพัด 2 โทนสี (`vColorA`, `vColorB`) พร้อมคำนวณการดูดกลืนแสงแบบ Beer-Lambert Law (`exp(-opticalPath * absorption * glassDensity)`) ทำให้เนื้อแก้วลึกใสระยิบระยับ

---

### 2.5 Dual Specular & Micro-Imperfection Polish (เงาสะท้อนและริ้วรอย)
- **Dual Specular Highlights**: ผสมผสานเงาสะท้อนแสงนวลนวล (`broadSpec`) และจุดสะท้อนแสงเข้มข้น (`sharpSpec`)
- **Curved Window Reflections**: จำลองเงาสะท้อนของหน้าต่าง และละอองแสง (Glint Streaks)
- **Air Bubbles & Surface Scratches**: สร้างฟองอากาศเล็กๆ (Inclusions) และรอยขีดข่วนจางๆ บนผิวแก้วด้วย Procedural Noise Function (`scratchDistanceA`, `scratchDistanceB`)

---

## 3. 120Hz Sub-Stepping Physics Engine

### 3.1 Fixed Time Step Loop (120Hz Sub-stepping)
- แยกการคำนวณฟิสิกส์ออกจาก Render Loop โดยใช้ **Fixed Time Step 120Hz (`FIXED_STEP = 1/120` วินาที)**
- กำหนด Sub-stepping สูงสุด 8 รอบต่อเฟรม (`MAX_PHYSICS_STEPS = 8`) ป้องกันปัญหาลูกแก้วทะลุกัน (Tunneling / Penetration) แม้จะเคลื่อนที่ด้วยความเร็วสูง

```javascript
const FIXED_STEP = 1 / 120;
const MAX_PHYSICS_STEPS = 8;
```

### 3.2 Dynamic Friction & Sleep Threshold
- แบ่งแรงเสียดทานการกลิ้งเป็น 3 ระดับตามความเร็ว (`FAST_ROLLING_DRAG`, `MEDIUM_ROLLING_DRAG`, `SLOW_ROLLING_DRAG`) ทำให้ลูกแก้วไหลลื่นในช่วงแรก และค่อยๆ ชะลออย่างเป็นธรรมชาติก่อนหยุดนิ่ง
- **Sleep Threshold Logic**: เมื่อความเร็วต่ำกว่า `0.028` ยูนิต ระบบจะเข้าสู่โหมด Sleep เพื่อลดภาระการคำนวณ CPU

---

## 4. Web Audio API Procedural Sound Synthesizer

- **Stereo Panning & Velocity Impulse**: เล่นเสียงลูกแก้วกระทบกัน (`collisionBuffer`) โดยคำนวณตำแหน่ง X เพื่อแบ่งทิศทางลำโพง ซ้าย-ขวา (Stereo Panning) และปรับความดังตามแรงกระแทก (Impact Strength)
- **Rolling Friction Filter**: มีระบบเสียงครืดสลัวๆ ขณะลูกแก้วกลิ้งด้วย Biquad Bandpass Filter โดยปรับความถี่และปริมาณเสียงตามความเร็วการกลิ้งโดยรวม

---

## 5. Summary & Architectural Takeaways

1. **Draw Call Efficiency**: เรนเดอร์ลูกแก้วทั้งหมดกี่สิบดวงก็ใช้ Draw Call เพียง **1-2 Calls** ผ่าน Instanced Rendering Buffer
2. **Zero Polygon Aliasing**: ได้ทรงกลมเนียนคมชัดทุกความละเอียดหน้าจอโดยไม่ต้องใช้ 3D Mesh
3. **Deterministic Physics**: คำนวณฟิสิกส์ลื่นไหล แม่นยำ ไม่กระตุก ไม่ข้ามเฟรมบนทุกอุปกรณ์

---

## Related Links
- Source Code: [public/games/goosl-marbles/app.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/goosl-marbles/app.js)
- Game Spec: [docs/gdd/games/goosl-marbles/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/goosl-marbles/spec.md)
- Wiki Home: [docs/wiki/wiki.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/wiki/wiki.md)
