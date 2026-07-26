# 🤖 AGENT.md — Workspace Customizations Root Guidance

See primary workspace guidance at [AGENT.md](../AGENT.md).

## Skill & Doc Management Rules
1. **Game Development Documentation**: Always maintain `docs/` according to `.agents/skills/game-doc-manager/SKILL.md`.
2. **Multi-Engine Support**: Utilize Phaser 3 and Babylon.js adapters in `engines/`.
3. **Quality & Aesthetics**: Keep UI polished, responsive, and performant.

## Version & Build Management Rules
1. **Version Number Sync**: การปรับเปลี่ยนเลข `version` ใน `public/build.json` ต้องปรับเปลี่ยนตามเวอร์ชันล่าสุดที่ระบุไว้ในเอกสาร [docs/changelog.md](../docs/changelog.md) เสมอ
2. **Build Number Format**: เลข `build` ใน `public/build.json` ให้ใช้เวลา ณ ขณะอัปเดตในรูปแบบ `HHMM` (ชั่วโมงและนาที 24 ชม. เช่น `2237`)
