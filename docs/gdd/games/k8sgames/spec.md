---
title: "☸️ K8s Games — 3D Kubernetes Cluster Management Simulator"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - k8sgames
  - kubernetes
  - threejs
  - simulation
  - 3d
  - devops
---

# ☸️ K8s Games — 3D Kubernetes Cluster Management Simulator

**Code Name:** `k8sgames`  
**Game ID:** `G047`  
**Creator:** [rohitg00](https://github.com/rohitg00/k8sgames)  
**Version:** `1.0.0` (Production Standalone Build)  
**Age Rating:** All Ages  
**Target Playtime:** 5 - 30 Minutes per Scenario / Sandbox Campaign  
**Supported Platforms:** Desktop & Mobile Web (Keyboard Terminal Input, Interactive Mouse & Orbit Camera)  
**Engine & Tech Stack:** Three.js 3D WebGL Engine, TailwindCSS UI Layer, Built-in Mock Kubernetes State Engine & Terminal Shell  
**Original Live Source:** [GitHub: rohitg00/k8sgames](https://github.com/rohitg00/k8sgames) | [k8sgames.com](https://k8sgames.com)  
**Tagline:** *"Learn Kubernetes by playing. Deploy pods, fix CrashLoopBackOff, scale replicas, and type real kubectl commands in an interactive 3D browser simulation."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**K8s Games** เป็นเกมจำลองการบริหารจัดการ Kubernetes Cluster แบบ 3 มิติในเบราว์เซอร์ ที่เปลี่ยนการเรียนรู้ DevOps & Container Orchestration ให้กลายเป็นเกมที่สนุก เข้าใจง่าย และได้ลงมือพิมพ์คำสั่งจริง

ผู้เล่นสามารถมองเห็นโหนด (Worker Nodes), พ็อด (Pods), เซอร์วิส (Services), และ Ingress Controller เป็นโมเดล 3D แบบเรียลไทม์ พร้อมจำลองสถานการณ์จริง เช่น พ็อดติดสถานะ `CrashLoopBackOff`, Node Out of Memory (OOM), การสเกล `Deployment`, และการแก้ปัญหาในโหมด Chaos Engineering

### 1.2 Core Game Modes & Features
1. **Interactive 3D Cluster Visualizer:**
   - แสดงผลโหนด คลัสเตอร์ และพ็อดเป็นตู้เซิร์ฟเวอร์และแคปซูล 3 มิติ
   - พ็อดมีแสงและสถานะตาม Kubernetes Lifecycle (`Pending`, `Running`, `CrashLoopBackOff`, `Terminating`)
2. **Integrated Real-Time Terminal & `kubectl` Shell:**
   - รองรับคำสั่ง kubectl ยอดนิยม: `kubectl get pods`, `kubectl describe`, `kubectl logs`, `kubectl scale`, `kubectl delete pod`, `kubectl rollout restart`
3. **Campaign Scenarios & Incident Response:**
   - ภารกิจฝึกอบรมตั้งแต่ระดับเริ่มต้น (Deploying your first NGINX Pod) ไปจนถึงระดับสูง (Fixing memory leaks, multi-replica failovers)
   - สะสมดาว (Campaign Stars) และ Achievement ถ้วยรางวัล
4. **Chaos Monkey & Sandbox Mode:**
   - โหมดจำลองวิกฤต (Chaos Mode): ระบบจะสุ่มทำลายโหนดหรือพ็อด ผู้เล่นต้องแก้ปัญหาให้คลัสเตอร์กลับมามี Health 100% ภายในเวลาจำกัด
   - โหมด Sandbox: ปรับแต่งคลัสเตอร์ได้อย่างอิสระเพื่อการทดลองและเรียนรู้

---

## 2. Controls & Interaction Guide

| Action | Desktop Controls |
| :--- | :--- |
| **Orbit / Rotate Camera** | คลิกซ้ายค้างแล้วลากเมาส์ (Drag to orbit) |
| **Pan Camera** | คลิกขวาค้างแล้วลากเมาส์ หรือ Shift + คลิกซ้ายลาก |
| **Zoom In / Out** | หมุนลูกกลิ้งเมาส์ (Scroll wheel) |
| **Open / Focus Terminal** | คลิกที่หน้าต่าง Terminal หรือกดปุ่มคีย์ลัดตามที่หน้าจอแสดง |
| **Inspect Pod / Node** | คลิกเลือกที่โมเดล Pod หรือ Node ในฉาก 3D |

---

## 3. Technical Specs & Catalog Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G047` |
| **Directory** | `public/games/k8sgames/` |
| **Main URL** | `/games/k8sgames/index.html` |
| **Engine / Framework** | Three.js 0.152.0 / WebGL / TailwindCSS / Vanilla ES Modules |
| **Category** | `Three.js 3D Engine` / `จำลองสถานการณ์ / จัดการทรัพยากร` |
| **Standalone Ready** | 100% Client-Side Simulation |
