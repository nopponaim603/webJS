# 🎮 Game Portfolio - HTML5 Games Showcase

เว็บไซต์สำหรับแสดงผลงานเกม HTML5 และเกมที่สามารถรันผ่าน Browser ได้ พร้อมด้วย UI/UX ที่ทันสมัยและสวยงาม

[![GitHub Repository](https://img.shields.io/badge/GitHub-nopponaim603%2FwebJS-181717?style=for-the-badge&logo=github)](https://github.com/nopponaim603/webJS)
![Game Portfolio](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Netlify-00AD9F?style=for-the-badge&logo=netlify)](https://mellifluous-sprite-70f0fc.netlify.app/)


## ✨ Features

- 🎨 **Modern Design** - ใช้ธีมสี Cyan/Turquoise สดใส พร้อม Gradient และ Animations
- 📱 **Responsive** - รองรับทุกขนาดหน้าจอ (Desktop, Tablet, Mobile)
- 🎮 **Interactive** - คลิกเกมเพื่อโหลดและแสดงผล พร้อม Hover Effects
- 🔍 **Search Function** - ค้นหาเกมได้ง่าย
- ⌨️ **Keyboard Shortcuts** - Space (Pause/Play), F (Fullscreen), ESC (Exit Fullscreen)
- 🎯 **Categories** - จัดหมวดหมู่เกมที่หลากหลาย
- ⚡ **Fast Loading** - ไม่ต้องติดตั้ง dependencies เพิ่มเติม

## 📁 โครงสร้างโปรเจค

```
webJs/
├── index.html          # หน้าเว็บหลัก
├── styles.css          # ไฟล์ CSS สำหรับ styling
├── script.js           # ไฟล์ JavaScript สำหรับ functionality
├── server.js           # Node.js HTTP Server (สำหรับรัน Live Server)
├── package.json        # Node.js package configuration
└── README.md           # เอกสารนี้
```

## 🚀 วิธีการ Setup Project

### ข้อกำหนดเบื้องต้น

- **Web Browser** - Chrome, Firefox, Safari, หรือ Edge (เวอร์ชันล่าสุด)
- **Text Editor** (ถ้าต้องการแก้ไข) - VS Code, Sublime Text, หรือ Notepad++
- **Node.js** (ถ้าต้องการใช้ Live Server) - เวอร์ชัน 14.0.0 ขึ้นไป [ดาวน์โหลด](https://nodejs.org/)

### ขั้นตอนการติดตั้ง

1. **Clone หรือ Download โปรเจค**
   ```bash
   # Clone จาก GitHub
   git clone https://github.com/nopponaim603/webJS.git
   cd webJS
   ```

   หรือ Download ZIP จาก [GitHub Repository](https://github.com/nopponaim603/webJS) และแตกไฟล์

2. **ตรวจสอบไฟล์**
   ให้แน่ใจว่ามีไฟล์หลักทั้งหมด:
   - `index.html` - หน้าเว็บหลัก
   - `styles.css` - Styling
   - `script.js` - Functionality
   - `server.js` - Node.js Server (ถ้าต้องการใช้)
   - `package.json` - NPM Configuration

3. **เสร็จสิ้น!** 🎉
   ไม่ต้องติดตั้ง dependencies เพิ่มเติม เพราะเป็น Vanilla HTML/CSS/JS

## 🎯 วิธีการรัน Project

### วิธีที่ 1: เปิดไฟล์โดยตรง (แนะนำสำหรับการดูเบื้องต้น)

1. ไปที่โฟลเดอร์ `webJs`
2. **Double-click** ที่ไฟล์ `index.html`
3. เว็บไซต์จะเปิดในเบราว์เซอร์เริ่มต้นของคุณ

### วิธีที่ 2: ใช้ Command Line (Windows)

```bash
# เปิด PowerShell หรือ Command Prompt
cd c:\Users\noppon\source\webJs
start index.html
```

### วิธีที่ 3: ใช้ Live Server (แนะนำสำหรับการพัฒนา)

ถ้าคุณใช้ **VS Code**:

1. ติดตั้ง Extension "Live Server"
2. เปิดโฟลเดอร์ `webJs` ใน VS Code
3. คลิกขวาที่ `index.html`
4. เลือก **"Open with Live Server"**
5. เว็บไซต์จะเปิดที่ `http://localhost:5500`

### วิธีที่ 4: ใช้ Node.js Live Server (แนะนำ! 🚀)

วิธีนี้ใช้ **Custom Node.js HTTP Server** ที่สร้างมาให้แล้ว - ไม่ต้องติดตั้ง package เพิ่มเติม!

**ขั้นตอน:**

```bash
# 1. เปิด Terminal/Command Prompt
cd c:\Users\noppon\source\webJs

# 2. รัน server
node server.js

# หรือใช้ npm script
npm start
```

**Server จะเริ่มทำงานที่:**
- 🌐 Local: `http://localhost:3000`
- 📱 Network: `http://<your-ip>:3000` (สามารถเข้าถึงจากอุปกรณ์อื่นในเครือข่ายเดียวกัน)

**Features ของ Node.js Server:**
- ✅ รองรับ MIME types ทั้งหมด (HTML, CSS, JS, รูปภาพ, ฟอนต์)
- ✅ แสดง Local IP สำหรับทดสอบบนมือถือ
- ✅ Error handling ที่ดี
- ✅ Graceful shutdown (Ctrl+C)
- ✅ Custom port: `PORT=3001 node server.js`
- ✅ ไม่ต้องติดตั้ง dependencies เพิ่ม (ใช้ Node.js built-in modules)

**หยุด Server:**
```bash
# กด Ctrl+C ใน Terminal
```

**เปลี่ยน Port:**
```bash
# Windows PowerShell
$env:PORT=3001; node server.js

# Windows CMD
set PORT=3001 && node server.js

# Linux/Mac
PORT=3001 node server.js
```

### วิธีที่ 5: ใช้ Python Simple HTTP Server

```bash
# Python 3
cd c:\Users\noppon\source\webJs
python -m http.server 8000

# เปิดเบราว์เซอร์ไปที่ http://localhost:8000
```

### วิธีที่ 6: ใช้ Node.js http-server (ต้องติดตั้ง package)

```bash
# ติดตั้ง http-server (ครั้งแรกเท่านั้น)
npm install -g http-server

# รัน server
cd c:\Users\noppon\source\webJs
http-server -p 8080

# เปิดเบราว์เซอร์ไปที่ http://localhost:8080
```

## 🎨 การปรับแต่ง

### เพิ่มเกมของคุณเอง

แก้ไขไฟล์ `script.js` ที่ตัวแปร `gamesData`:

```javascript
const gamesData = [
    {
        id: 1,
        title: "ชื่อเกมของคุณ",
        category: "หมวดหมู่",
        image: "URL_รูปภาพ_หรือ_path_ไปยังรูป",
        gradient: "linear-gradient(135deg, #สีที่1 0%, #สีที่2 100%)"
    },
    // เพิ่มเกมอื่นๆ...
];
```

### เปลี่ยนสีธีม

แก้ไขไฟล์ `styles.css` ที่ส่วน `:root`:

```css
:root {
    /* เปลี่ยนสีหลัก */
    --primary-gradient: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
    --cyan-500: #YOUR_MAIN_COLOR;
    
    /* เปลี่ยนสีพื้นหลัง */
    --bg-primary: #YOUR_BG_COLOR;
}
```

### เพิ่มเกมจริงที่เล่นได้

ในฟังก์ชัน `loadGame()` ที่ไฟล์ `script.js`, แทนที่ส่วน placeholder ด้วย:

```javascript
// ตัวอย่าง: ใช้ iframe
gamePlaceholder.innerHTML = `
    <iframe 
        src="${game.gameUrl}" 
        style="width: 100%; height: 100%; border: none;"
        allowfullscreen>
    </iframe>
`;
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1200px
- **Tablet**: 968px - 1200px
- **Mobile**: < 968px
- **Small Mobile**: < 640px

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Play เกม |
| `F` | เปิด/ปิด Fullscreen |
| `ESC` | ออกจาก Fullscreen |

## 🎯 หมวดหมู่เกมที่มี

- 🏃 **Obby Games** - เกมกระโดดผจญภัย
- 👥 **2 Player Games** - เกมสองคน
- 💝 **Games for Girls** - เกมสำหรับผู้หญิง
- 🤝 **Co-op Games** - เกมร่วมมือ
- ⚔️ **Games for Boys** - เกมสำหรับผู้ชาย
- 📱 **Mobile Games** - เกมมือถือ
- 🌐 **HTML5 Games** - เกม HTML5

## 🛠️ เทคโนโลยีที่ใช้

- **HTML5** - โครงสร้างเว็บไซต์
- **CSS3** - Styling, Animations, Responsive Design
- **Vanilla JavaScript** - Functionality, Interactivity
- **Google Fonts (Inter)** - Typography
- **Unsplash** - ภาพตัวอย่าง (สามารถเปลี่ยนได้)

## 📊 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ✅ Latest |
| Firefox | ✅ Latest |
| Safari | ✅ Latest |
| Edge | ✅ Latest |
| Opera | ✅ Latest |

## 🌐 การ Deploy (Hosting)

### Netlify (แนะนำ 🚀)

1. เชื่อมต่อ GitHub Repository กับ Netlify
2. **สำคัญ:** ในส่วน **Branch to deploy** ให้ระบุเป็น `main` (ไม่ใช่ master)
3. ส่วน **Build command** ให้ปล่อยว่างไว้
4. ส่วน **Publish directory** ให้ระบุเป็น `.` (หรือ root)

**Live Demo:** [https://mellifluous-sprite-70f0fc.netlify.app/](https://mellifluous-sprite-70f0fc.netlify.app/)

### Vercel

1. เชื่อมต่อ GitHub Repository กับ Vercel
2. เลือก Framework Preset เป็น **Other**
3. **Build Command**: ปล่อยว่าง
4. **Output Directory**: ปล่อยว่าง (Vercel จะใช้ root อัตโนมัติ)

### GitHub Pages

1. ไปที่ Settings > Pages ใน GitHub Repository
2. เลือก Source เป็น **Deploy from a branch**
3. เลือก Branch **main** และโฟลเดอร์ **/ (root)**
4. กด Save และรอสักครู่

## 🐛 Troubleshooting

### ปัญหา: รูปภาพไม่แสดง
**วิธีแก้**: 
- ตรวจสอบ URL ของรูปภาพใน `script.js`
- ถ้าใช้รูปภาพจาก local, ให้ใส่ path ที่ถูกต้อง
- ตรวจสอบ CORS policy ถ้าใช้รูปจาก external source

### ปัญหา: JavaScript ไม่ทำงาน
**วิธีแก้**:
- เปิด Developer Console (F12) เพื่อดู error
- ตรวจสอบว่าไฟล์ `script.js` ถูก link ใน `index.html` ถูกต้อง
- ตรวจสอบ path ของไฟล์

### ปัญหา: CSS ไม่แสดงผล
**วิธีแก้**:
- ตรวจสอบว่าไฟล์ `styles.css` ถูก link ใน `index.html` ถูกต้อง
- ลอง hard refresh (Ctrl + F5)
- ตรวจสอบ path ของไฟล์

### ปัญหา: Node.js Server - Port ถูกใช้งานแล้ว
**วิธีแก้**:
```bash
# เปลี่ยนไปใช้ port อื่น
PORT=3001 node server.js

# หรือหา process ที่ใช้ port 3000 และปิดมัน (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### ปัญหา: Node.js ไม่พบ
**วิธีแก้**:
- ตรวจสอบว่าติดตั้ง Node.js แล้ว: `node --version`
- ถ้ายังไม่มี ให้ดาวน์โหลดจาก [nodejs.org](https://nodejs.org/)
- รีสตาร์ท Terminal หลังติดตั้ง

### ปัญหา: ไม่สามารถเข้าถึงจากมือถือ
**วิธีแก้**:
- ตรวจสอบว่าคอมพิวเตอร์และมือถืออยู่ใน Wi-Fi เดียวกัน
- ปิด Firewall ชั่วคราว หรือเพิ่ม exception สำหรับ port 3000
- ใช้ IP address ที่แสดงใน Terminal (Network address)

## 📝 To-Do / Future Enhancements

- [ ] เพิ่มระบบ Login/Authentication
- [ ] เพิ่มระบบ Rating และ Comments
- [ ] เพิ่ม Backend สำหรับจัดเก็บข้อมูลเกม
- [ ] เพิ่มระบบ Favorites
- [ ] เพิ่ม Dark/Light Mode Toggle
- [ ] เพิ่ม Multiplayer Support
- [ ] เพิ่ม Leaderboard
- [ ] เพิ่ม Achievement System

## 🤝 Contributing

ถ้าคุณต้องการพัฒนาโปรเจคนี้ต่อ:

1. Fork โปรเจค
2. สร้าง Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจคนี้เป็น Open Source และสามารถนำไปใช้ได้ฟรี

## 👨‍💻 Author

สร้างโดย Antigravity AI Assistant

## 📞 Contact & Support

หากมีคำถามหรือต้องการความช่วยเหลือ:
- เปิด Issue ใน Repository
- ติดต่อผ้านพัฒนา

---

**สนุกกับการสร้างเกม! 🎮✨**

Made with ❤️ using HTML, CSS, and JavaScript
