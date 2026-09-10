# 📋 วิเคราะห์โปรเจกต์ Event Map — คู่มือสำหรับผู้เริ่มต้น

---

## 1. ภาพรวมโปรเจกต์คืออะไร?

**Event Map** คือเว็บแอปฯ แผนที่งาน Event แบบ Interactive (โต้ตอบได้)
ให้คนที่มางานสามารถ:
- ดูบูทบนแผนผัง Floor Plan แบบ Zoomable (ซูมได้)
- ค้นหาบูท / กรองตามโซน / หมวดหมู่
- ดูรายละเอียดบูทแต่ละร้าน
- ขอเส้นทางเดินจากทางเข้าไปถึงบูท
- แชร์บูทให้เพื่อน
- รองรับ **2 ภาษา**: ลาว 🇱🇦 และอังกฤษ 🇬🇧
- รองรับ **มือถือ**, **แท็บเล็ต**, **คอมพิวเตอร์**

---

## 2. โครงสร้าง Folder และ File

```
event_boothai/                ← Root (โฟลเดอร์หลัก)
├── index.html                ← หน้าแรก (แผนที่ + รายชื่อบูท)  ⭐ ไฟล์หลัก
├── booths.html               ← หน้า "ดูบูทแบบ List ทั้งหมด"
├── style.css                 ← สไตล์ทั้งระบบ (ทุกหน้าใช้ร่วมกัน)
├── .git/                     ← ไฟล์ Git (ระบบ Version Control ไม่ต้องแตะ)
└── js/                       ← โฟลเดอร์ JavaScript ทั้งหมด
    ├── app.js                ← จุดเริ่มต้นของโปรแกรม (Entry Point)  ⭐ ไฟล์หลัก
    ├── config.js             ← ค่าตั้งค่า / ค่าคงที่ทั่วระบบ
    ├── state.js              ← เก็บ "สถานะ" ของแอปฯ
    ├── api.js                ← ดึงข้อมูลจาก Google Sheets
    ├── i18n.js               ← ระบบภาษา (ลาว / อังกฤษ)
    ├── components.js         ← สร้าง HTML ที่ใช้ซ้ำหลายหน้า (Header / Dialog)
    ├── map.js                ← ทุกอย่างที่เกี่ยวกับแผนที่ (วาด / ซูม / เดิน)
    └── ui.js                 ← จัดการส่วน UI (การ์ดบูท / ค้นหา / กรอง / แชร์)
```

### ทำไมต้องแยก Folder `js/` ออกมา?
> เปรียบเหมือนบ้าน — ห้องครัวไม่ได้อยู่กลางห้องนอน
> เราแยกของที่ "ชอบด้วยกัน" ไว้ในโฟลเดอร์เดียวกัน
> JavaScript ทั้งหมดอยู่ใน `js/` ทำให้หาง่าย แก้ง่าย

---

## 3. อธิบายแต่ละไฟล์

---

### 📄 `index.html` — หน้าแรก (แผนที่)

**ทำอะไร**: เป็น "กระดาษเปล่า" ที่กำหนดโครงสร้างหน้าจอ
JavaScript จะนำเนื้อหาจริงมา "เติม" ทีหลัง

**ส่วนสำคัญ:**
```html
<!-- โหลด Font สวยๆ จาก Google -->
<link href="https://fonts.googleapis.com/css2?family=Inter...Noto+Sans+Lao...">

<!-- โหลด CSS -->
<link rel="stylesheet" href="style.css" />

<!-- กล่องว่างๆ รอ JS มาเติม Header -->
<header class="header"></header>

<!-- แผนที่ SVG (ตัวแผนที่อยู่ตรงนี้) -->
<svg class="floor-svg" id="floor-svg">
  <g id="world">         ← โลกทั้งหมด (ถูก transform เมื่อ pan/zoom)
    <g id="zone-labels"> ← JS ใส่ Label โซน A B C D ตรงนี้
    <g id="booth-layer"> ← JS วาดบูทตรงนี้
    <g id="gates">       ← JS วาดทางเข้า/ออกตรงนี้
  </g>
</svg>

<!-- จุดเริ่มต้น JavaScript (โหลดเป็น Module) -->
<script type="module" src="js/app.js"></script>
```

**คำถาม: ทำไม HTML ดูว่างเปล่ามาก?**
> เพราะเว็บนี้ใช้ **Dynamic Rendering** — JavaScript จะสร้าง HTML เพิ่มเติมหลังหน้าโหลดเสร็จ
> ถ้าลบ `<script>` ออก หน้าจะว่างเปล่าทันที

**ความแตกต่างระหว่าง index.html และ booths.html:**
| จุด | index.html | booths.html |
|-----|-----------|-------------|
| `<body>` class | ไม่มี class | `class="booths-page"` |
| หน้าที่ | แสดงแผนที่ | แสดงรายการบูทแบบ Grid |
| แผนที่ SVG | ถูกซ่อนบน desktop | ถูกซ่อน (ซ่อนโดย CSS) |

> **Trick ที่น่าสนใจ**: Developer ใช้ CSS Class `booths-page` บน `<body>` เพื่อบอก CSS ว่า "หน้านี้คือหน้า Booths" แล้ว CSS จะปรับ Layout ให้เอง เช่น `.booths-page .map-shell { display: none }`

---

### 🎨 `style.css` — ความสวยงามทั้งหมด

**ทำอะไร**: ควบคุมสีสัน รูปร่าง ตำแหน่ง และ Animation ทุกอย่างบนหน้าจอ

**ส่วนสำคัญที่ต้องเข้าใจ:**

#### CSS Variables (ตัวแปร CSS) — บรรทัด 1-10
```css
:root {
  --brand: #991b1e;        /* สีแดงเข้มของแบรนด์ */
  --brand-hover: #7e171a;  /* สีแดงเข้มขึ้นเมื่อ hover */
  --bg: #f5f6fa;           /* สีพื้นหลังหน้าจอ */
  --surface: #fff;         /* สีพื้นหลังการ์ด */
  --text: #182132;         /* สีตัวอักษรหลัก */
  --muted: #778196;        /* สีตัวอักษรรอง (เทาๆ) */
  --border: #e3e7ef;       /* สีเส้นขอบ */
  --shadow: 0 2px 5px ...  /* เงา */
}
```
> **เปรียบเหมือน**: พาเล็ตสีของจิตรกร กำหนดไว้ที่เดียวแล้วใช้ทั่วทั้งไฟล์
> ถ้าอยากเปลี่ยนสีแบรนด์ทั้งเว็บ แค่แก้ `--brand` บรรทัดเดียว!

#### Responsive Design — Media Queries
```css
/* Mobile (< 640px): navigation ย้ายมาด้านล่าง */
@media (max-width: 639px) { ... }

/* Desktop (≥ 1100px): แสดง 3 คอลัมน์ */
@media (min-width: 1100px) {
  .layout {
    grid-template-columns: 270px minmax(0, 1fr) 285px;
    /* [รายการบูท] [แผนที่] [รายละเอียดบูท] */
  }
}
```
> **เปรียบเหมือน**: ห้องที่ปรับตัวเองให้เข้ากับขนาดบ้าน
> บ้านเล็ก (มือถือ) → จัดแบบหนึ่ง, บ้านใหญ่ (คอม) → จัดอีกแบบ

#### .sr-only — สำหรับ Accessibility
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
}
```
> **เปรียบเหมือน**: ข้อความที่ตาเห็นไม่เห็น แต่โปรแกรมอ่านหน้าจอสำหรับคนตาบอดอ่านได้
> Developer เขียนแบบนี้เพื่อทำให้เว็บเข้าถึงได้ (Accessible)

---

### ⚙️ `js/config.js` — ค่าตั้งค่าส่วนกลาง

**ทำอะไร**: เก็บค่าที่ใช้ทั่วทั้งโปรเจกต์ ไม่ให้กระจัดกระจาย

```javascript
// Shortcut สำหรับ document.querySelector
export const $ = (selector) => document.querySelector(selector);
// แทนที่จะเขียน document.querySelector("#search") ทุกครั้ง
// เขียนแค่ $("#search") ได้เลย!

// URL ของ Google Sheets API
export const GOOGLE_SHEET_API = "https://script.google.com/macros/...";

// สีของแต่ละโซน
export const zones = {
  A: { background: "#ffebee", border: "#ffbac4", text: "#a32847" }, // ชมพู
  B: { background: "#fff5cc", border: "#f6d963", text: "#946126" }, // เหลือง
  C: { background: "#eaf7ed", border: "#bce9c7", text: "#137658" }, // เขียว
  D: { background: "#e1f2ff", border: "#a7dcff", text: "#07628e" }, // ฟ้า
};

// ขนาดแผนที่ SVG
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 900;
```

**ทำไม Developer ถึงสร้างไฟล์ config แยก?**
> ถ้าต้องเปลี่ยน URL ของ Google Sheets ใหม่ แก้แค่ที่เดียวใน config.js
> ถ้าไม่มี config แยก ต้องไปหาและแก้ในไฟล์อื่นๆ อีก 3-4 ที่ โอกาสพลาดสูง

---

### 🧠 `js/state.js` — "สมอง" ของแอปฯ

**ทำอะไร**: เก็บ "สถานะปัจจุบัน" ของแอป เช่น บูทไหนถูกเลือก, กำลังค้นหาคำว่าอะไร

```javascript
// บันทึกภาษาที่เลือกไว้ใน localStorage (ยังอยู่หลัง refresh)
const savedLang = localStorage.getItem("eventmap_lang");

// รายชื่อบูทจาก Google Sheets (loaded ทีหลัง)
export let featuredShops = {};

// อาร์เรย์บูททั้งหมด
export const booths = [];

// Map สำหรับค้นหาบูทจาก ID อย่างรวดเร็ว
// เช่น boothById.get("A01") → ข้อมูลบูท A01
export let boothById = new Map();

// สถานะทั้งหมดของแอปฯ
export const state = {
  selected: "",    // ID บูทที่เลือกอยู่ เช่น "A01"
  query: "",       // คำค้นหาปัจจุบัน
  category: "all", // หมวดหมู่ที่กรอง
  zone: "all",     // โซนที่กรอง
  scale: 1,        // ระดับ zoom แผนที่
  minScale: 1,     // zoom น้อยสุด
  maxScale: 5,     // zoom มากสุด
  x: 0,           // ตำแหน่ง pan แนวนอน
  y: 0,           // ตำแหน่ง pan แนวตั้ง
  lang: savedLang === "en" ? "en" : "lo", // ภาษาปัจจุบัน
};
```

**เปรียบเหมือนอะไร?**
> `state` เหมือน "กระดานไวท์บอร์ดในออฟฟิศ" ที่ทุกคนมองมาอ่านว่าตอนนี้สถานะเป็นยังไง
> ทุกไฟล์ JS ที่ต้องการรู้ว่า "บูทไหนถูกเลือก?" ก็แค่ดูที่ `state.selected`

**ถ้าลบ state.js ออก?**
> แอปล่มทันที ไม่มีที่เก็บข้อมูลสถานะ ทุกอย่างจะจำไม่ได้

---

### 🌐 `js/api.js` — ติดต่อกับ Google Sheets

**ทำอะไร**: ดึงข้อมูลร้านค้าจาก Google Sheets มาแสดงในเว็บ

```javascript
export async function loadShopsFromGoogleSheet(onSuccessCallback) {
  try {
    // ส่ง HTTP Request ไปที่ Google Apps Script
    const response = await fetch(GOOGLE_SHEET_API);

    // ถ้า Server ตอบกลับด้วย Error (404, 500 ฯลฯ) ให้ throw Error
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // แปลง Response เป็น JavaScript Object
    const shops = await response.json();
    
    // บันทึกข้อมูลร้านค้าใน state
    setFeaturedShops(shops);

    // เรียก callback function หลังดึงข้อมูลสำเร็จ
    if (onSuccessCallback) {
      onSuccessCallback();
    }
  } catch (error) {
    // ถ้าเกิด Error ใดๆ แสดงใน Console แต่ไม่ crash แอป
    console.error("Error loading shop data:", error);
  }
}
```

**Data Flow ของ API:**
```
แอปโหลดเสร็จ
      ↓
loadShopsFromGoogleSheet() ถูกเรียก
      ↓
fetch(GOOGLE_SHEET_API) → HTTP GET Request
      ↓
Google Apps Script รับ Request
      ↓
อ่านข้อมูลจาก Google Sheets
      ↓
ส่งกลับเป็น JSON
      ↓
response.json() แปลง JSON เป็น Object
      ↓
setFeaturedShops(shops) บันทึกใน state.js
      ↓
onSuccessCallback() → renderMap() + applyFilters()
      ↓
หน้าจอแสดงข้อมูลร้านจริงๆ
```

**ทำไม Developer ถึงใช้ `async/await`?**
> การดึงข้อมูลจาก Internet ใช้เวลา (อาจ 1-5 วินาที)
> ถ้าไม่ใช้ `async/await` แอปจะ "ค้าง" รอข้อมูล ทำอะไรไม่ได้
> `async/await` ให้แอปทำงานอื่นต่อไปก่อน พอข้อมูลมาถึงค่อยอัปเดต

**ถ้า API ดึงข้อมูลไม่ได้?**
> แอปยังทำงานได้ แต่บูทจะแสดงชื่อ Default เช่น "Booth A01" แทน
> Developer ออกแบบให้ Fail Gracefully (ล้มอย่างสง่างาม)

---

### 🌍 `js/i18n.js` — ระบบภาษา (Internationalization)

**i18n คืออะไร?** ย่อมาจาก "Internationalization" (i + 18 ตัวอักษร + n)
แปลว่า "ทำให้รองรับหลายภาษา"

**ทำอะไร**: เก็บข้อความทุกชิ้นในสองภาษา และช่วยสลับภาษา

```javascript
export const translations = {
  lo: {  // ภาษาลาว
    directoryTitle: "ບູທທັງໝົດ",
    searchPlaceholder: "ຄົ້ນຫາຮ້ານ ຫຼື ເລກບູທ...",
    boothCount: (count) => `${count} ບູທ`,  // ← function! ใส่ตัวเลขได้
    // ...
  },
  en: {  // ภาษาอังกฤษ
    directoryTitle: "All Booths",
    searchPlaceholder: "Search shops or booth numbers...",
    boothCount: (count) => `${count} booths`,
    // ...
  }
};

// Function หลักสำหรับแปลข้อความ
export function t(key, ...args) {
  const lang = state.lang || "lo";
  // ดึง translation ตาม key และภาษาปัจจุบัน
  const val = translations[lang]?.[key] || translations["lo"]?.[key] || key;
  // ถ้า val เป็น function (เช่น boothCount) → เรียกมันพร้อม args
  if (typeof val === "function") {
    return val(...args);
  }
  return val;
}
```

**ตัวอย่างการใช้ `t()`:**
```javascript
t("directoryTitle")           // → "ບູທທັງໝົດ" (ถ้าภาษาลาว)
t("directoryTitle")           // → "All Booths" (ถ้าภาษาอังกฤษ)
t("boothCount", 42)           // → "42 ບູທ" หรือ "42 booths"
```

**ทำไม HTML ถึงมี `data-i18n` attribute?**
```html
<h2 data-i18n="directoryTitle">All Booths</h2>
```
> JavaScript จะ scan หาทุก element ที่มี `data-i18n` แล้วเปลี่ยนข้อความ
> เมื่อเปลี่ยนภาษา ข้อความทั้งหน้าอัปเดตพร้อมกัน

```javascript
export function updateLanguageUI() {
  // อัปเดต title หน้า
  document.title = t(titleKey);
  
  // อัปเดตทุก element ที่มี data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  
  // บันทึกภาษาที่เลือกไว้ใน Browser (ยังจำหลัง refresh)
  localStorage.setItem("eventmap_lang", lang);
}
```

---

### 🧩 `js/components.js` — ส่วนประกอบที่ใช้ซ้ำ

**ทำอะไร**: สร้าง HTML ส่วนที่เหมือนกันทั้ง 2 หน้า ไม่ต้องก็อป-วางซ้ำ

```javascript
// 1. ใส่ SVG Icons เข้าไปใน body (ซ่อนไว้)
export function injectIconsSVG() {
  // ตรวจว่ามีอยู่แล้วหรือยัง ถ้ามีแล้วไม่ต้องใส่ซ้ำ
  if ($("#reusable-icons-svg")) return;
  
  const svgHTML = `
    <svg id="reusable-icons-svg" width="0" height="0" ...>
      <symbol id="i-pin">...</symbol>     ← icon หมุด
      <symbol id="i-search">...</symbol>  ← icon แว่นขยาย
      <symbol id="i-shop">...</symbol>    ← icon ร้านค้า
    </svg>
  `;
  document.body.insertAdjacentHTML("afterbegin", svgHTML);
}

// 2. วาด Header Navigation
export function renderHeader() { ... }

// 3. ใส่ Dialog Modals (Popup)
export function injectDialogs() { ... }
```

**ทำไม Developer ถึงสร้าง icons เป็น SVG Symbols?**
> เปรียบเหมือน "แม่พิมพ์" — สร้างครั้งเดียวแล้วใช้ซ้ำได้ไม่จำกัด
> ```html
> <!-- ใช้ icon pin -->
> <svg><use href="#i-pin"/></svg>
> <!-- ใช้ icon search -->
> <svg><use href="#i-search"/></svg>
> ```
> ประหยัดการ download icon file หลายไฟล์

---

### 🗺️ `js/map.js` — หัวใจของแผนที่

**ทำอะไร**: ทุกอย่างที่เกี่ยวกับแผนที่ — วาดบูท, ซูม, แพน, เส้นทาง

**Functions หลัก:**

#### `buildMapData()` — กำหนดตำแหน่งบูท
```javascript
export function buildMapData(populateCategoryDropdownCb) {
  booths.length = 0; // ล้างรายการบูทเก่า

  // สร้างโซน A, B, C (โซนละ 12 บูท = 36 บูท)
  ["A", "B", "C"].forEach((zone, zoneIndex) => {
    for (let number = 1; number <= 12; number++) {
      // คำนวณตำแหน่ง x, y บนแผนที่
      addBooth(zone, number, x, y);
    }
  });

  // โซน D (6 บูท แถวเดียวด้านบน)
  for (let number = 1; number <= 6; number++) {
    addBooth("D", number, 155 + (number-1)*78, 175);
  }
}
```
> รวมทั้งหมด **42 บูท** (A1-A12, B1-B12, C1-C12, D1-D6)

#### `renderMap()` — วาดแผนที่จริงๆ
```javascript
export function renderMap(applyFiltersCb) {
  // วาด Zone Labels (A, B, C, D)
  addZoneLabel("A", 212, 277);
  addZoneLabel("B", 422, 277);
  
  // วาดบูทแต่ละอัน
  booths.forEach((booth) => {
    const group = svgElement("g", { class: "booth", ... });
    group.append(
      svgElement("rect", { x: booth.x, y: booth.y, ... }), // กล่อง
      svgElement("text", {...}, booth.id),                  // เลขบูท
    );
    // เพิ่ม Event Listener เมื่อกด Enter บนคีย์บอร์ด
    group.addEventListener("keydown", ...);
    $("#booth-layer").append(group);
  });
  
  // วาดทางเข้า/ออก
  // สร้างปุ่มกรอง Zone
}
```

#### `animateTo()` — Animation เมื่อซูม/แพน
```javascript
export function animateTo(x, y, scale, duration = 260) {
  // ใช้ requestAnimationFrame สำหรับ smooth animation
  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    // Easing function (ค่อยๆ ช้าลง = cubic ease-out)
    const easing = 1 - Math.pow(1 - progress, 3);
    
    state.x = start.x + (target.x - start.x) * easing;
    state.y = start.y + (target.y - start.y) * easing;
    state.scale = start.scale + (target.scale - start.scale) * easing;
    paint();
    
    if (progress < 1) animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}
```
> **เปรียบเหมือน**: ปาลูกบอลแล้วมันค่อยๆ ช้าลงก่อนหยุด (ไม่หยุดทันที)
> `reducedMotion.matches` → ถ้า User ตั้งค่าระบบให้ลดการเคลื่อนไหว แอปจะข้าม animation

#### `setupMapInteractions()` — จัดการ Input ทุกรูปแบบ
| Input | Action |
|-------|--------|
| Wheel (scroll) | Zoom in/out |
| Pointer (drag) | Pan แผนที่ |
| Pinch (2 นิ้ว) | Zoom in/out |
| Arrow keys | Pan ด้วยคีย์บอร์ด |
| +/- keys | Zoom ด้วยคีย์บอร์ด |
| Click บูท | เลือกบูท |
| Tap บูท | เลือกบูท (mobile) |

#### `routeFromEntrance()` — วาดเส้นทาง
```javascript
export function routeFromEntrance(booth, entranceX) {
  // คำนวณจุด waypoint ของเส้นทาง
  const points = [
    [entranceX, 837],  // ทางเข้า
    [entranceX, 808],  // ขึ้นมานิด
    [aisleX, ...],     // เดินตามทางเดิน
    [edgeX, centerY],  // ถึงบูท
  ];
  
  // คำนวณความยาวทั้งหมด (เลือก route สั้นกว่า)
  const length = points.reduce((total, point, index) => {
    if (!index) return total;
    const prev = points[index-1];
    return total + Math.hypot(point[0]-prev[0], point[1]-prev[1]);
  }, 0);
  
  return { points, length, entrance: entranceX === 255 ? 1 : 2 };
}
```

---

### 🖥️ `js/ui.js` — จัดการ User Interface

**ทำอะไร**: ทุกอย่างที่ User กดแล้วเห็นการเปลี่ยนแปลง

#### `escapeHTML()` — ป้องกัน XSS Attack
```javascript
export function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", ... })[character]
  );
}
```
> **XSS (Cross-Site Scripting)** คือการโจมตีที่แฮกเกอร์ฉีด JavaScript เข้าไปในเว็บ
> เช่น ถ้าชื่อร้านคือ `<script>alert('hacked')</script>`
> ถ้าไม่ escape → browser รัน code นั้น!
> ถ้า escape → แสดงเป็นข้อความ `&lt;script&gt;...` ปลอดภัย

#### `filteredBooths()` — Logic การค้นหา
```javascript
export function filteredBooths() {
  return booths.filter((booth) => {
    // รวมทุกอย่างที่ค้นหาได้เป็น string เดียว
    const searchable = `${booth.id} ${booth.name} Zone ${booth.zone} ...`.toLowerCase();

    return (
      searchable.includes(state.query) &&              // ตรงกับคำค้นหา
      (state.zone === "all" || booth.zone === state.zone) &&  // ตรงกับโซน
      (state.category === "all" || booth.category === state.category) // ตรงกับหมวด
    );
  });
}
```

#### `selectBooth()` — เมื่อเลือกบูท
```javascript
export function selectBooth(id, openMobile = false, center = false) {
  const booth = boothById.get(id);
  if (!booth) return;

  state.selected = id;

  // แสดงรายละเอียดบูททั้ง Desktop และ Mobile
  desktopDetail.innerHTML = detailHTML(booth);
  mobileDetail.innerHTML = detailHTML(booth);

  // Highlight บูทบนแผนที่
  boothElements.forEach((element, boothId) => {
    element.classList.toggle("selected", boothId === id);
  });

  // แสดง Pin บนแผนที่
  pin.setAttribute("transform", `translate(${booth.x + booth.width/2} ${booth.y - 3})`);

  // Zoom ไปหาบูท (ถ้าขอ)
  if (center) centerBooth(booth);

  // เปิด Dialog บนมือถือ
  if (openMobile && !desktopQuery.matches) {
    dialog.showModal();
  }

  // อัปเดต URL hash (#A01) เพื่อ share ได้
  url.hash = id;
  history.replaceState(null, "", url);
}
```

#### `shareBooth()` — แชร์บูท
```javascript
export async function shareBooth() {
  // ถ้ารองรับ Web Share API → แชร์ผ่าน native share sheet
  if (navigator.share) {
    await navigator.share({ title, text, url });
  }
  // ถ้าไม่ รองรับ Clipboard API → copy ลิ้งค์
  else if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast("Booth link copied.");
  }
  // ถ้าไม่รองรับเลย → แสดง prompt ให้ copy เอง
  else {
    window.prompt("Copy link:", url);
  }
}
```
> **เปรียบเหมือน**: ลองกดปุ่มประตูหลายบาน ถ้าบานแรกเปิดได้ก็เข้า ถ้าไม่ก็ลองบานถัดไป

---

### 🚀 `js/app.js` — จุดเริ่มต้นทั้งหมด (Entry Point)

**ทำอะไร**: เป็น "วาทยากร" ที่สั่งให้ทุกไฟล์ทำงานพร้อมกัน และเชื่อมทุกอย่างเข้าด้วยกัน

```javascript
// Import ทุกสิ่งที่ต้องการจากไฟล์อื่นๆ
import { $ } from "./config.js";
import { boothById, state } from "./state.js";
import { injectIconsSVG, renderHeader, injectDialogs } from "./components.js";
import { setLanguage, updateLanguageUI, ... } from "./i18n.js";
import { buildMapData, renderMap, fitMap, ... } from "./map.js";
import { loadShopsFromGoogleSheet } from "./api.js";
import { populateCategoryDropdown, applyFilters, selectBooth, ... } from "./ui.js";

function initApp() {
  // ขั้น 1: ใส่ Icon, Header, Dialog
  injectIconsSVG();
  renderHeader();
  injectDialogs();

  // ขั้น 2: เชื่อม handler ระหว่างโมดูล
  setSelectBoothHandler(selectBooth);

  // ขั้น 3: ลงทะเบียน callback เมื่อเปลี่ยนภาษา
  registerUIUpdateCallback(() => {
    buildMapData(populateCategoryDropdown);
    renderMap(applyFilters);
    applyFilters();
  });

  // ขั้น 4: ตั้ง Event Listeners
  // ปุ่มภาษา
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => setLanguage(e.currentTarget.dataset.lang));
  });
  setupUIEventListeners();
  setupMapInteractions();

  // ขั้น 5: Render ครั้งแรก
  updateLanguageUI();
  fitMap();

  // ขั้น 6: เลือกบูทเริ่มต้น (จาก URL hash หรือ A01)
  const initialId = location.hash.slice(1).toUpperCase();
  const defaultBooth = boothById.has(initialId) ? initialId : "A01";
  selectBooth(defaultBooth);
}

// รอให้ HTML โหลดเสร็จก่อน
document.addEventListener("DOMContentLoaded", () => {
  initApp();                    // เริ่มแอปด้วยข้อมูล Default
  loadShopsFromGoogleSheet(() => {  // ดึงข้อมูลจริงจาก Google Sheets
    buildMapData(populateCategoryDropdown);
    renderMap(applyFilters);
    applyFilters();
    selectBooth(state.selected || "A01");
  });
});
```

---

## 4. Flow การทำงาน

```
User เปิดเว็บ index.html
      ↓
Browser โหลด HTML → อ่านโครงสร้างหน้า
      ↓
Browser โหลด style.css → ทำให้สวยงาม
      ↓
Browser โหลด js/app.js (type="module")
      ↓
app.js import ไฟล์อื่น: config, state, components, i18n, map, api, ui
      ↓
DOMContentLoaded event → initApp() ถูกเรียก
      ↓
┌─────────────────────────────────────────────┐
│ 1. injectIconsSVG()  → ใส่ SVG icons ลงใน body │
│ 2. renderHeader()    → วาด Header Navigation  │
│ 3. injectDialogs()   → สร้าง Dialog Modals    │
│ 4. setLanguage()     → ตั้งภาษาเริ่มต้น (ลาว)  │
│ 5. buildMapData()    → คำนวณตำแหน่งบูท 42 อัน  │
│ 6. renderMap()       → วาดบูทบน SVG           │
│ 7. fitMap()          → ปรับ zoom ให้เห็นทั้งแผนที่ │
│ 8. selectBooth("A01")→ เลือกบูทแรกเริ่มต้น    │
└─────────────────────────────────────────────┘
      ↓
User เห็นหน้าจอแรก (พร้อมข้อมูล Default)
      ↓
[Background] loadShopsFromGoogleSheet() → fetch Google Sheets API
      ↓
ข้อมูลร้านค้าจริงมาถึง (JSON)
      ↓
อัปเดต state.featuredShops → rebuild map → UI อัปเดต
      ↓
บูทแสดงชื่อร้าน/โลโก้จริงๆ แทน Default
```

---

## 5. ปัญหาที่พบในโค้ด

### 🔴 ปัญหา 1: CSS Duplicate (style.css บรรทัด 824-904 และ 1039-1109)

**ปัญหา**: Media Query `@media (max-width: 639px)` ถูกเขียนซ้ำสองครั้ง

```css
/* บรรทัด 824 - ซ้ำที่ 1 */
@media (max-width: 639px) {
  body { padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
  .navigation { position: fixed; ... }
  ...
}

/* บรรทัด 1039 - ซ้ำที่ 2 (เหมือนกันทุกอย่าง!) */
@media (max-width: 639px) {
  body { padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
  .navigation { position: fixed; ... }
  ...
}
```

**ทำไมถึงเป็นปัญหา?**
- โค้ดยาวขึ้นโดยไม่จำเป็น (ไฟล์ใหญ่ขึ้น โหลดช้าขึ้น)
- ถ้าแก้ที่เดียว ต้องจำไปแก้อีกที่ด้วย — โอกาสพลาดสูง
- ทำให้ Developer คนอื่นสับสน

**วิธีแก้**: ลบ block ซ้ำที่ 2 ออก (บรรทัด 1039-1109)

### 🔴 ปัญหา 2: HTML เหมือนกัน 100% ทั้งสองหน้า

**ปัญหา**: `index.html` และ `booths.html` มีเนื้อหา HTML เหมือนกัน ต่างกันแค่ `class="booths-page"` บน `<body>`

**ทำไมถึงเป็นปัญหา?**
- ถ้าต้องแก้โครงสร้าง (เช่น เพิ่ม element ใหม่) ต้องแก้ทั้งสองไฟล์
- โอกาสสองหน้าไม่ sync กัน

**วิธีแก้** (แนะนำ): ใช้ `fetch()` โหลด template จากไฟล์เดียว หรือใช้ Framework เช่น Vite/Next.js ที่รองรับ Layout Components

---

## 6. สรุปแต่ละไฟล์ (Quick Reference)

### `index.html`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | โครงกระดูกของหน้าแรก (แผนที่) |
| **ทำงานเมื่อ** | User เปิด URL หลัก |
| **เรียกใช้** | `style.css`, `js/app.js` |
| **ถูกเรียกโดย** | User/Browser โดยตรง |
| **สิ่งสำคัญ** | `type="module"` ทำให้ JS ทำงานเป็น Module System |
| **ถ้าแก้จะกระทบ** | โครงสร้างหน้าจอ, ต้องแก้ booths.html พร้อมกัน |

### `booths.html`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | หน้า "All Booths" แสดงรายการบูท |
| **ทำงานเมื่อ** | User คลิก "All Booths" หรือไปที่ `/booths.html` |
| **เรียกใช้** | `style.css`, `js/app.js` |
| **สิ่งสำคัญ** | `class="booths-page"` บน body เป็น key สำหรับ CSS |
| **ถ้าแก้จะกระทบ** | Layout หน้า Booths, ต้องดู CSS `.booths-page` ด้วย |

### `style.css`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | ดูแลความสวยงามทั้งระบบ |
| **ทำงานเมื่อ** | Browser โหลดหน้าใดก็ตาม |
| **เรียกใช้** | Google Fonts (external) |
| **ถูกเรียกโดย** | index.html, booths.html |
| **สิ่งสำคัญ** | CSS Variables, Media Queries, `.booths-page` modifier |
| **ถ้าแก้จะกระทบ** | รูปร่าง/สีทุกองค์ประกอบ ทั้งสองหน้า |

### `js/config.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | เก็บค่าคงที่ทั่วระบบ |
| **ทำงานเมื่อ** | ถูก import โดยไฟล์อื่น |
| **ถูกเรียกโดย** | ทุกไฟล์ JS |
| **สิ่งสำคัญ** | `$` shortcut, `GOOGLE_SHEET_API`, สีโซน A-D |
| **ถ้าแก้จะกระทบ** | ทุกอย่าง (ใช้ร่วมกันทั้งระบบ) |

### `js/state.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | เก็บสถานะแอปทั้งหมด |
| **ทำงานเมื่อ** | ตลอดเวลา (เปลี่ยนแปลงตามการใช้งาน) |
| **ถูกเรียกโดย** | map.js, ui.js, i18n.js, app.js |
| **สิ่งสำคัญ** | `state.selected`, `state.lang`, `booths[]`, `boothById` |
| **ถ้าแก้จะกระทบ** | พฤติกรรมทั้งระบบ |

### `js/api.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | ดึงข้อมูลร้านค้าจาก Google Sheets |
| **ทำงานเมื่อ** | หลัง initApp() เสร็จ (async) |
| **เรียกใช้** | `config.js` (URL), `state.js` (เก็บข้อมูล) |
| **ถูกเรียกโดย** | `app.js` |
| **สิ่งสำคัญ** | `async/await`, Error handling แบบ Graceful |
| **ถ้าแก้จะกระทบ** | ข้อมูลที่แสดงในบูท |

### `js/i18n.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | จัดการระบบ 2 ภาษา |
| **ทำงานเมื่อ** | โหลดครั้งแรก + ทุกครั้งที่เปลี่ยนภาษา |
| **เรียกใช้** | `config.js`, `state.js` |
| **ถูกเรียกโดย** | `app.js`, `map.js`, `ui.js` |
| **สิ่งสำคัญ** | `t(key)` function, `updateLanguageUI()`, localStorage |
| **ถ้าแก้จะกระทบ** | ข้อความทุกชิ้นบนหน้า |

### `js/components.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | สร้าง HTML ที่ใช้ร่วมกันทั้งสองหน้า |
| **ทำงานเมื่อ** | initApp() ถูกเรียกครั้งแรก |
| **เรียกใช้** | `config.js` |
| **ถูกเรียกโดย** | `app.js` |
| **สิ่งสำคัญ** | SVG Symbols, Header HTML, Dialog HTML |
| **ถ้าแก้จะกระทบ** | Header Navigation, Dialog Popup, Icons ทั้งระบบ |

### `js/map.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | วาดและควบคุมแผนที่ทั้งหมด |
| **ทำงานเมื่อ** | buildMapData() + renderMap() + user interactions |
| **เรียกใช้** | `config.js`, `state.js`, `i18n.js` |
| **ถูกเรียกโดย** | `app.js`, `ui.js` |
| **สิ่งสำคัญ** | SVG rendering, Pan/Zoom engine, Route calculation |
| **ถ้าแก้จะกระทบ** | แผนผัง, การซูม, เส้นทาง |

### `js/ui.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | จัดการ UI interactions ทั้งหมด |
| **ทำงานเมื่อ** | User โต้ตอบกับ UI |
| **เรียกใช้** | `config.js`, `state.js`, `i18n.js`, `map.js` |
| **ถูกเรียกโดย** | `app.js` |
| **สิ่งสำคัญ** | `selectBooth()`, `applyFilters()`, `shareBooth()` |
| **ถ้าแก้จะกระทบ** | การค้นหา, การ์ดบูท, Dialog, แชร์ |

### `js/app.js`
| หัวข้อ | รายละเอียด |
|--------|-----------|
| **หน้าที่** | Entry Point — เชื่อมทุกอย่างเข้ากัน |
| **ทำงานเมื่อ** | HTML โหลดเสร็จ (DOMContentLoaded) |
| **เรียกใช้** | ทุกไฟล์ JS |
| **ถูกเรียกโดย** | HTML `<script type="module" src="js/app.js">` |
| **สิ่งสำคัญ** | `initApp()`, ลำดับการ initialize |
| **ถ้าแก้จะกระทบ** | ลำดับการ startup ทั้งหมด |

---

## 7. Dependency Map (ใครเรียกใคร)

```
index.html / booths.html
    │
    ├── style.css (CSS)
    │
    └── js/app.js ← Entry Point
            │
            ├── js/config.js         (ค่าคงที่)
            ├── js/state.js          (สถานะ)
            ├── js/components.js     (Header/Icons/Dialogs)
            │       └── js/config.js
            ├── js/i18n.js           (ภาษา)
            │       ├── js/config.js
            │       └── js/state.js
            ├── js/api.js            (Google Sheets)
            │       ├── js/config.js
            │       └── js/state.js
            ├── js/map.js            (แผนที่)
            │       ├── js/config.js
            │       ├── js/state.js
            │       └── js/i18n.js
            └── js/ui.js             (UI)
                    ├── js/config.js
                    ├── js/state.js
                    ├── js/i18n.js
                    └── js/map.js
```

> **กฎสำคัญที่ Developer ตั้งไว้**: ไม่มีไฟล์ไหน import กลับไปหา app.js
> ทิศทางการ import ไหลทางเดียว: app.js → ไฟล์อื่น ✅

---

## 8. สรุปภาพรวมแบบเข้าใจง่าย

**เปรียบโปรเจกต์นี้เป็นห้างสรรพสินค้า:**

| ส่วนเว็บ | เปรียบกับอะไร |
|---------|--------------|
| `index.html` | แปลนพื้นที่ห้าง |
| `style.css` | การตกแต่งภายใน (สี, ป้าย, แสง) |
| `js/app.js` | ผู้จัดการห้าง (สั่งให้ทุกแผนกทำงาน) |
| `js/config.js` | คู่มือมาตรฐานห้าง (สีแบรนด์, ขนาดมาตรฐาน) |
| `js/state.js` | กระดานข้อมูลส่วนกลาง (ตอนนี้ลูกค้าอยู่แผนกไหน) |
| `js/api.js` | ระบบ POS ที่ดึงข้อมูลจาก database สินค้า |
| `js/i18n.js` | ล่ามภาษา (แปลป้ายทั้งห้างเป็นลาว/อังกฤษ) |
| `js/components.js` | ทีมตกแต่ง (ป้ายทางเข้า, เคาน์เตอร์) |
| `js/map.js` | แผนที่นำทางในห้าง |
| `js/ui.js` | พนักงานต้อนรับ (จัดการ interaction กับลูกค้า) |

---

## 9. Learning Path — ควรเรียนอะไรก่อน-หลัง?

### 🟢 Phase 1: รู้จักโครงสร้าง (1-2 สัปดาห์)
**เรียนอะไร:**
- HTML Basics: Tags, Attributes, Semantic HTML
- CSS Basics: Selectors, Box Model, Colors
- เปิดเว็บนี้แล้ว inspect ด้วย DevTools (F12)

**ฝึกในโปรเจกต์นี้:**
1. แก้สี `--brand` ใน `style.css` → ดูว่าเปลี่ยนตรงไหนบ้าง
2. เพิ่ม/ลบ class ใน `index.html` → ดูผลลัพธ์

---

### 🟡 Phase 2: เข้าใจ CSS (2-3 สัปดาห์)
**เรียนอะไร:**
- Flexbox, CSS Grid
- CSS Variables
- Media Queries (Responsive Design)
- CSS Transitions/Animations

**ฝึกในโปรเจกต์นี้:**
1. ดู Layout ที่ `style.css` บรรทัด 906-955 (Desktop 3-column)
2. ลอง resize browser ดูว่า layout เปลี่ยนยังไง
3. เพิ่มหมวดหมู่สีใหม่ใน `style.css`

---

### 🟠 Phase 3: JavaScript พื้นฐาน (3-4 สัปดาห์)
**เรียนอะไร:**
- Variables, Functions, Arrays, Objects
- DOM Manipulation (`querySelector`, `innerHTML`)
- Events (`addEventListener`, `click`, `input`)
- Template Literals (backtick strings)

**ฝึกในโปรเจกต์นี้:**
1. อ่าน `js/config.js` → เข้าใจ `export`
2. อ่าน `js/state.js` → เข้าใจ Object และ Map
3. แก้ข้อความใน `js/i18n.js` → เพิ่มภาษาไทย

---

### 🔴 Phase 4: JavaScript ขั้นสูง (4-6 สัปดาห์)
**เรียนอะไร:**
- ES Modules (`import`/`export`)
- async/await, Promises, fetch API
- Higher-order functions (`.map()`, `.filter()`, `.reduce()`)
- localStorage

**ฝึกในโปรเจกต์นี้:**
1. อ่าน `js/api.js` → เข้าใจ async/await
2. อ่าน `js/ui.js` `filteredBooths()` → เข้าใจ `.filter()`
3. ลองเพิ่มหมวดหมู่บูทใหม่

---

### 🟣 Phase 5: โปรเจกต์นี้โดยเฉพาะ (2-3 สัปดาห์)
**เรียนอะไร:**
- SVG Basics (วาดรูปด้วย Code)
- Browser APIs (localStorage, URL, history)
- Pointer Events (touch/mouse unified)

**ฝึกในโปรเจกต์นี้:**
1. อ่าน `js/map.js` `renderMap()` → เข้าใจ SVG
2. ลองเพิ่มบูทใน Zone D (ปัจจุบัน 6 บูท → ลอง 8 บูท)
3. แก้สีของโซนใน `js/config.js`

---

### 📁 ไฟล์ที่ควรฝึกแก้ตามลำดับ

```
1. style.css          ← แก้สี ดูผล เข้าใจ CSS
       ↓
2. js/i18n.js         ← เพิ่มข้อความ/ภาษา
       ↓
3. js/config.js       ← เปลี่ยนค่าต่างๆ
       ↓
4. js/state.js        ← เข้าใจ State Management
       ↓
5. js/ui.js           ← แก้ Logic การค้นหา/แสดงผล
       ↓
6. js/map.js          ← เพิ่ม/แก้บูทบนแผนที่
       ↓
7. js/api.js          ← เชื่อมกับ API อื่น
       ↓
8. js/app.js          ← ปรับ Startup Sequence
```

> **คำแนะนำ**: อย่ากลัวที่จะทดลอง! เปิด DevTools (F12) ไว้ตลอด
> Console จะบอกว่ามี Error ตรงไหน และคุณจะเรียนรู้ได้เร็วมาก 🚀
