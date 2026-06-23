# Sap — A Storybook on the Web 🌿

> *"ห้องเล็ก ๆ ที่หายใจได้"*
> A softly-told story, read like turning pages of a real book — but alive on the web.

---

## What Is Sap?

Sap is a **web-based storybook** — not a blog, not a portfolio.
It reads like a book: quiet, page by page, chapter by chapter.
The reader should feel like they are **holding a book**, not scrolling a website.

The tone is soft, warm, and gentle — like reading alone in a quiet room at night.

---

## Core Concept

### 📖 Chapter Structure (บท)

The story is divided into **chapters** (บท):

```
บทที่ 1 — คืนที่เบาที่สุด (ฉากแรก)
บทที่ 2 — ...
บทที่ 3 — ...
...
```

- Each chapter is a **separate data file** (e.g. `chapters/chapter-1.json` or a JS module)
- Only the **current chapter** is loaded at any time → **lazy loading for speed**
- The app never loads all chapters at once

### Content Blocks (per chapter)

Each chapter contains an array of content blocks, same as the current `MY_SPACE.blocks`:

| Type      | Purpose                         |
|-----------|----------------------------------|
| `text`    | Story paragraphs                 |
| `quote`   | Highlighted quote from character |
| `image`   | Illustration / scene image       |
| `music`   | Embedded Spotify / YouTube       |

---

## 🧑‍🎨 Characters (ตัวละคร)

Each chapter may feature **different characters**. Right now there is only one:

### Sap (ตัวเอก)
- A quiet boy who finds peace in a small room
- Grows sprouts on his windowsill
- Lives simply, breathes slowly

**More characters will be added over time.** The structure must support this:

```js
// Example: chapter data with character info
{
  chapter: 1,
  title: "คืนที่เบาที่สุด",
  subtitle: "ฉากแรก",
  characters: ["sap"],          // which characters appear
  heroImage: "SAP-01.png",
  blocks: [ ... ]
}
```

Character definitions live in a **separate file** (e.g. `characters/sap.json`):

```js
{
  id: "sap",
  name: "Sap",
  description: "เด็กหนุ่มเงียบ ๆ ที่ค้นพบความสงบในห้องเล็ก ๆ",
  avatar: "characters/sap-avatar.png"    // optional
}
```

---

## 📑 Table of Contents — สารบัญ (Full Page, Not Navbar)

> **สารบัญต้องเป็นหน้าเต็ม** — ไม่ใช่ navbar หรือ sidebar

The Table of Contents (TOC) is a **dedicated full page/screen**, designed like a real book's TOC:

- Shows all chapters with their titles
- Shows which chapters have been **read** ✓
- Shows which chapter the reader is **currently on** →
- Tap/click a chapter → navigate to it (lazy loads that chapter)
- Beautiful, book-like design — not a simple list

```
┌─────────────────────────────────────────┐
│              ✦  สารบัญ  ✦              │
│                                         │
│   บทที่ 1 ─── คืนที่เบาที่สุด    ✓    │
│   บทที่ 2 ─── ...               →    │
│   บทที่ 3 ─── ...                     │
│   บทที่ 4 ─── ...                     │
│                                         │
└─────────────────────────────────────────┘

✓ = read    → = currently reading    (blank) = unread
```

How to access the TOC:
- A subtle **button or icon** on screen (e.g. ☰ or a book icon)
- **NOT a permanent navbar** — keep the reading experience clean
- Feels like flipping to the front of the book

---

## 🔖 Reading Progress — จำหน้าที่อ่าน

The app **remembers the reader's progress** using `localStorage`:

### What to save:
```js
{
  currentChapter: 2,            // which chapter they're on
  currentScrollPosition: 0.45,  // how far through the chapter (0–1)
  chaptersRead: [1],            // which chapters are completed
  lastReadAt: "2026-06-23T..."  // timestamp
}
```

### Behavior:
- **On open**: Resume exactly where the reader left off (chapter + scroll position)
- **On chapter complete**: Mark as read, auto-advance or show "next chapter" prompt
- **On TOC**: Show read/unread/current status for each chapter
- Use `localStorage` (no server needed) — works offline too

---

## 🖼️ Images — รูปภาพ

### Current images
Images are stored in the **same folder** as `index.html`:
- `SAP-01.png` — hero image (Sap sitting by window with sprouts under starry sky)

### Image management
- All story images live in the **project folder** (or a subfolder like `images/`)
- Images can be used in:
  - **Chapter hero images** — the main illustration per chapter
  - **Inline images** — within story blocks (`type: "image"`)
  - **Home screen** — featured on the landing/home page
- File names must be **exact** (case-sensitive for Vercel deployment)
- Images use `loading="lazy"` for performance

### Home Screen
The **home/landing screen** should showcase:
- App title "Sap"
- A featured image (currently `SAP-01.png`)
- Entry point to start reading or open TOC (สารบัญ)
- Beautiful, immersive — like a book cover

---

## 📱 Add to Home Screen — PWA Icon (ไอคอนหน้าจอ)

When users "Add to Home Screen" on iOS/Android, the app should show a **beautiful icon** — not a generic browser screenshot.

### What's set up:
- **`manifest.json`** — PWA manifest with app name, icons, theme color, standalone display
- **`icons/`** folder — All icon sizes generated from `SAP-01.png` (cropped to Sap by the window)
  - `apple-touch-icon.png` (180×180) — iOS home screen
  - `icon-192.png` (192×192) — Android / Chrome
  - `icon-512.png` (512×512) — Splash screen / high-res
  - `favicon.ico`, `favicon-16.png`, `favicon-32.png` — Browser tabs
- **Meta tags in `index.html`**:
  - `<link rel="apple-touch-icon">` — iOS icon
  - `<link rel="manifest">` — Android PWA
  - `<meta name="apple-mobile-web-app-capable">` — Standalone on iOS
  - `<meta name="apple-mobile-web-app-status-bar-style">` — Status bar style
  - `<meta name="theme-color">` — Status bar color (sage green `#6B9080`)

### Behavior:
- **iOS**: "Add to Home Screen" → Shows Sap icon with title "Sap", opens in standalone mode (no Safari chrome)
- **Android**: "Add to Home Screen" → Shows Sap icon, app name, opens like a native app
- **Browser tab**: Shows favicon in the tab

### To update the icon:
1. Replace `SAP-01.png` with a new hero image
2. Re-run icon generation:
   ```bash
   convert SAP-01.png -gravity Center -crop 816x816+0+100 +repage icons/icon-base.png
   convert icons/icon-base.png -resize 512x512 icons/icon-512.png
   convert icons/icon-base.png -resize 192x192 icons/icon-192.png
   convert icons/icon-base.png -resize 180x180 icons/apple-touch-icon.png
   convert icons/icon-base.png -resize 32x32 icons/favicon-32.png
   convert icons/icon-base.png -resize 16x16 icons/favicon-16.png
   convert icons/favicon-32.png icons/favicon-16.png icons/favicon.ico
   ```
3. Deploy to Vercel
4. On phone: Delete old bookmark → "Add to Home Screen" again

---

## 🏗️ Architecture — How It Should Work

### File Structure (Target)

```
/
├── index.html                    # Main app shell (SPA)
├── Claude.md                     # This file — project vision
├── HOW-TO-START.md               # Setup guide
│
├── chapters/                     # Chapter data (lazy loaded)
│   ├── chapter-1.js (or .json)
│   ├── chapter-2.js
│   └── ...
│
├── characters/                   # Character definitions
│   ├── sap.json
│   └── ...
│
├── images/                       # All story images
│   ├── SAP-01.png
│   └── ...
│
└── .gitignore
```

### App Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────────┐
│  Home /  │────▶│ สารบัญ   │────▶│ บทที่ N          │
│  Cover   │     │ (TOC)    │     │ (lazy loaded)    │
│          │     │          │◀────│                  │
└──────────┘     └──────────┘     └──────────────────┘
      │                                    │
      │         ┌──────────────┐           │
      └────────▶│ Resume where │◀──────────┘
                │ reader left  │  (auto-save to
                │ off          │   localStorage)
                └──────────────┘
```

### Key Technical Decisions

1. **Single Page App** — No page reloads. Transitions between TOC/chapters are in-app
2. **Lazy Loading** — `fetch()` or dynamic `import()` to load only the active chapter
3. **localStorage** — Save reading progress (chapter, scroll %, read history)
4. **No framework** — Keep it as pure HTML/CSS/JS (static, deployable to Vercel as-is)
5. **WebGL gradient** — Keep the living background gradient (current implementation)
6. **Scroll-based reveal** — Keep IntersectionObserver animations for content blocks
7. **Responsive** — Works beautifully on phone, tablet, and desktop

---

## 🎨 Design Principles

- **Book feel** — The reader should forget they're on a website
- **Quiet** — No loud UI. No distracting navigation bars
- **Typography first** — Three font layers:
  - **EkkamaiVibe** (`--sans`) — Primary font for body, UI, Thai+Latin. Local `.ttf`, 5 weights (Thin→Heavy). A contemporary Thai-Latin sans-serif by Ekkamai Foundry.
  - **Noto Serif Display / Thai** (`--serif`) — Story text, quotes. Google Fonts.
  - **IBM Plex Mono** (`--mono`) — Labels, captions, eyebrow text. Google Fonts.
- **Warm palette** — Paper tones, sage green, soft shadows
- **Smooth transitions** — Fade between pages, scroll reveal for text blocks
- **Minimal chrome** — TOC button is subtle, only appears when needed

---

## 📋 Implementation Priority

### Phase 1 — Chapter System & TOC
- [ ] Restructure data into separate chapter files
- [ ] Build chapter lazy loader
- [ ] Create full-page Table of Contents (สารบัญ)
- [ ] Add chapter navigation (prev/next)

### Phase 2 — Reading Progress
- [ ] Save current chapter + scroll position to localStorage
- [ ] Resume reading on app open
- [ ] Show read/unread status on TOC

### Phase 3 — Characters
- [ ] Create character data structure
- [ ] Display character info per chapter (subtle, not intrusive)
- [ ] Support multiple characters per chapter

### Phase 4 — Images & Home Screen
- [ ] Organize images into `images/` folder
- [ ] Design home/cover screen with featured image
- [ ] Support chapter-specific hero images
- [ ] Image gallery or showcase on home screen

### Phase 5 — Polish
- [ ] Page turn animations / transitions between chapters
- [ ] Reading time estimate per chapter
- [ ] Smooth scroll-to-resume on app open
- [ ] Offline support (service worker)

---

## 💭 Philosophy

Sap is not just a website. It's a **feeling**.

The reader should open it and feel calm.
Like opening a book on a quiet night.
Like sitting by a window with sprouts growing beside you.

Every design decision should ask:
> *"Does this make the reading experience more gentle?"*

If yes → keep it.
If no → remove it.

---

*SAP by Teera — a quiet home on the internet.* 🌱
