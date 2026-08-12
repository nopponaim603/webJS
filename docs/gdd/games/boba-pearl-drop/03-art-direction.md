# 🧋 BOBA PEARL DROP: 100% SUGAR — Art & Visual Direction

**Version:** 1.0.0 | **Last Updated:** 2026-08-12  

---

## 🎨 Visual Style & Tone

**Tone & Atmosphere:** Cute, Pastel, Warm, Juicy, Delicious!  
งานภาพเน้นความสดใส น่ารับประทาน สะอาดตา (Clean Minimalist 3D Aesthetic) ผสมผสานวัสดุโปร่งแสง ผิวมันวาว และเอฟเฟกต์เรืองแสงนุ่มนวล (Soft Bloom / Glow)

---

## 🎨 Color Palette Reference

```
[Milk Tea Brown]  #C68B59  │  [Caramel Cream]    #F7ECDE
[Taro Purple]    #B2A4FF  │  [Pastel Lilac]     #E8A0BF
[Matcha Green]   #80B9AD  │  [Zen Bamboo]       #C3EDC0
[Dark Boba Pearl] #2C1820  │  [Shiny Highlight]  #FFFFFF
```

---

## 💎 Material & Shader Setup (BabylonJS PBR)

### 1. Boba Pearl Material (ตัวผู้เล่น)
- **Base Color:** Deep Tapioca Brown (`#2C1820` / `#1F1018`)
- **Metallic / Roughness:** Metallic = 0.1, Roughness = 0.15 (ผิวมันวาวสะท้อนแสง)
- **ClearCoat Coating:** ClearCoat Enabled = 1.0 (ผิวน้ำเชื่อมเคลือบมัน)
- **SubSurface / Transmission:** SubSurface Translucency เล็กน้อย ให้ความรู้สึกหนึบหนับยืดหยุ่น

### 2. Sugar Cubes (ก้อนน้ำตาล 🧊)
- **Base Color:** Pure White (`#FFFFFF`)
- **Alpha / Opacity:** 0.85 (โปร่งแสงเล็กน้อยแบบเกล็ดน้ำตาล)
- **Glow Layer Effect:** ส่องประกายแสงระยิบระยับ (Soft White Glow)

---

## ✨ Particle Effects & Visual Polish

1. **Pearl Rolling Trail:** อนุภาคละอองความหวานพุ่งออกจากท้ายเม็ดไข่มุกขณะกลิ้งความเร็วสูง
2. **Sugar Collect Sparkle:** เมื่อเก็บก้อนน้ำตาล จะเกิดประกายดาวและเอฟเฟกต์วงแหวนขยายตัว (Ring Particle Shockwave)
3. **Victory Boba Splash:** เมื่อกระโดดลงถ้วยชาไข่มุกยักษ์ เกิดเอฟเฟกต์น้ำชาสาดกระจายพร้อม Confetti หลากสีสัน!

---

## 📱 UI/UX Theme & Typography

- **Font Family:** 'Outfit', 'Nunito', 'Fredoka', หรือ Font มนุษย์สายพาสเทลน่ารัก
- **Style:** Glassmorphism Card (การ์ดกระจกฝ้าโค้งมน), แถบ Sugar Bar สีทองไล่เฉด (Gradient Gold)
- **HUD Elements:**
  - 🧊 **Sugar Level Bar:** แถบหลอด % น้ำตาล (0% - 100%)
  - ⏱️ **Timer:** นาฬิกาจับเวลาสปีดรัน (00:00.00)
  - ⭐ **Score / Stars Counter:** คะแนนสะสมประจำด่าน

---

## 🔗 Related Documents
- [Concept & Vision](./00-concept.md)
- [Core Mechanics](./01-mechanics.md)
- [Level Design](./02-level-design.md)
