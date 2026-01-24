# 🔧 Git Workflow Guide

คู่มือการใช้งาน Git สำหรับโปรเจค Game Portfolio

## 📋 Quick Reference

### คำสั่งพื้นฐาน

```bash
# ตรวจสอบสถานะ
git status

# ดูประวัติ commit
git log --oneline

# ดู remote repository
git remote -v
```

### การทำงานกับโค้ด

```bash
# 1. ดึงการเปลี่ยนแปลงล่าสุดจาก GitHub
git pull

# 2. แก้ไขไฟล์ตามต้องการ
# ...

# 3. ตรวจสอบไฟล์ที่เปลี่ยนแปลง
git status

# 4. เพิ่มไฟล์ที่ต้องการ commit
git add .                    # เพิ่มทุกไฟล์
git add index.html           # เพิ่มไฟล์เฉพาะ
git add *.css                # เพิ่มไฟล์ตามรูปแบบ

# 5. Commit การเปลี่ยนแปลง
git commit -m "คำอธิบายการเปลี่ยนแปลง"

# 6. Push ไปยัง GitHub
git push
```

## 📝 Commit Message Convention

ใช้รูปแบบ Conventional Commits:

```bash
# Features
git commit -m "feat: เพิ่มเกมใหม่ในหมวดหมู่ Action"

# Bug Fixes
git commit -m "fix: แก้ไขปัญหาการแสดงผลบนมือถือ"

# Documentation
git commit -m "docs: อัปเดต README ด้วยคำแนะนำการติดตั้ง"

# Styling
git commit -m "style: ปรับปรุง CSS สำหรับ dark mode"

# Refactoring
git commit -m "refactor: ปรับโครงสร้างโค้ด JavaScript"

# Performance
git commit -m "perf: ปรับปรุงความเร็วการโหลดเกม"

# Tests
git commit -m "test: เพิ่ม unit tests สำหรับ game loader"

# Chores
git commit -m "chore: อัปเดต dependencies"
```

## 🌿 Branch Management

### สร้าง Branch ใหม่

```bash
# สร้างและเปลี่ยนไปยัง branch ใหม่
git checkout -b feature/new-game-category

# หรือใช้คำสั่งใหม่
git switch -c feature/new-game-category
```

### ทำงานกับ Branches

```bash
# ดู branches ทั้งหมด
git branch -a

# เปลี่ยน branch
git checkout main
git switch main

# Merge branch
git checkout main
git merge feature/new-game-category

# ลบ branch
git branch -d feature/new-game-category
```

## 🔄 Sync กับ GitHub

### Pull Changes

```bash
# ดึงและ merge การเปลี่ยนแปลง
git pull

# ดึงโดยไม่ merge (fetch only)
git fetch
```

### Push Changes

```bash
# Push ไปยัง branch ปัจจุบัน
git push

# Push branch ใหม่
git push -u origin feature/new-feature

# Force push (ระวัง!)
git push --force
```

## ⚠️ การแก้ไขปัญหา

### Undo Changes

```bash
# ยกเลิกการเปลี่ยนแปลงในไฟล์ (ยังไม่ add)
git checkout -- index.html
git restore index.html

# ยกเลิก git add
git reset HEAD index.html
git restore --staged index.html

# ยกเลิก commit ล่าสุด (เก็บการเปลี่ยนแปลง)
git reset --soft HEAD~1

# ยกเลิก commit ล่าสุด (ลบการเปลี่ยนแปลง)
git reset --hard HEAD~1
```

### แก้ไข Commit Message

```bash
# แก้ไข commit message ล่าสุด
git commit --amend -m "ข้อความใหม่"

# แก้ไขและเพิ่มไฟล์ใน commit ล่าสุด
git add forgotten-file.js
git commit --amend --no-edit
```

### Conflicts

```bash
# เมื่อเกิด conflict ระหว่าง merge/pull
# 1. แก้ไขไฟล์ที่ conflict
# 2. เพิ่มไฟล์ที่แก้แล้ว
git add .

# 3. Continue merge
git merge --continue
# หรือ
git commit
```

## 🏷️ Tags

```bash
# สร้าง tag
git tag v1.0.0
git tag -a v1.0.0 -m "Version 1.0.0 - Initial Release"

# Push tags
git push --tags

# ดู tags
git tag -l

# ลบ tag
git tag -d v1.0.0
git push origin --delete v1.0.0
```

## 📊 Useful Commands

### ดูประวัติ

```bash
# ดู log แบบสวยงาม
git log --oneline --graph --all --decorate

# ดูการเปลี่ยนแปลงในไฟล์
git diff
git diff index.html

# ดูการเปลี่ยนแปลงที่ staged
git diff --staged
```

### Stash (เก็บงานชั่วคราว)

```bash
# เก็บการเปลี่ยนแปลงชั่วคราว
git stash

# เก็บพร้อมข้อความ
git stash save "WIP: working on new feature"

# ดู stash list
git stash list

# นำ stash กลับมา
git stash pop

# นำ stash เฉพาะกลับมา
git stash apply stash@{0}

# ลบ stash
git stash drop
git stash clear  # ลบทั้งหมด
```

## 🔐 GitHub Authentication

### Personal Access Token (แนะนำ)

1. ไปที่ GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. เลือก scopes: `repo`, `workflow`
4. Copy token
5. ใช้ token แทน password เมื่อ push

### SSH Key (ทางเลือก)

```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# เพิ่ม key ใน GitHub Settings → SSH and GPG keys

# เปลี่ยน remote เป็น SSH
git remote set-url origin git@github.com:nopponaim603/webJS.git
```

## 📚 Best Practices

1. **Commit บ่อยๆ** - แต่ละ commit ควรมีความหมายชัดเจน
2. **Pull ก่อน Push** - ป้องกัน conflicts
3. **ใช้ Branches** - แยก feature/bugfix ออกจาก main
4. **เขียน Commit Message ที่ดี** - อธิบายว่าทำอะไร ทำไม
5. **Review ก่อน Commit** - ใช้ `git diff` ตรวจสอบการเปลี่ยนแปลง
6. **ไม่ commit ไฟล์ sensitive** - ใช้ `.gitignore`
7. **Test ก่อน Push** - ตรวจสอบว่าโค้ดทำงานได้

## 🆘 Help

```bash
# ดูคำสั่งทั้งหมด
git help

# ดูคู่มือคำสั่งเฉพาะ
git help commit
git help branch
```

## 🔗 Useful Links

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Repository:** [https://github.com/nopponaim603/webJS](https://github.com/nopponaim603/webJS)
