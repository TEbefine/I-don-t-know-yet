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
บทที่ 2 — ข้างนอกหน้าต่าง (โลกที่มีทั้งคมและอุ่น)
...
```

- Each chapter is a **separate JS file** (e.g. `chapters/chapter-1.js`)
- Only the **current chapter** is loaded at any time → **lazy loading via JSONP-style callbacks**
- The app never loads all chapters at once
- A chapter manifest (`chapters/index.js`) lists all available chapters

### Content Blocks (per chapter)

Each chapter contains an array of content blocks:

| Type      | Purpose                         |
|-----------|----------------------------------|
| `text`    | Story paragraphs                 |
| `quote`   | Highlighted quote from character |
| `image`   | Illustration / scene image       |
| `music`   | Embedded Spotify / YouTube       |

### Reading Experience

- **Scroll-based** — Content blocks fade in as the reader scrolls (IntersectionObserver)
- **Scroll cue** — A minimal animated line + dot (no text) hints the reader to scroll down
- **Progress bar** — Thin sage-green line at the top fills as the reader scrolls through the chapter
- No page-based tap navigation — scrolling is the reading mechanism

---

## 🧑‍🎨 Characters (ตัวละคร)

### Naming Convention

- **Project/branding name**: "Sap" (English, used in titles and UI)
- **Character name in story text**: "ซิป" (Thai pronunciation, used in all chapter body text and quote attributions)

### ซิป (ตัวเอก)
- A quiet boy who finds peace in a small room
- Grows sprouts on his windowsill
- Lives simply, breathes slowly

> **Note**: The character section (badges, modal popups) has been **removed** from the UI.
> Character data files still exist in `characters/` for future use, but they are not loaded or displayed.
> The design philosophy is: let the reader meet characters through the story, not through UI elements.

---

## 📑 Table of Contents — สารบัญ

> **สารบัญ is a full-screen overlay** — not a navbar or sidebar

The Table of Contents opens as a blurred overlay:

- Shows all chapters with titles and subtitles
- Shows reading status:
  - `✓` = read (sage green)
  - `→` = currently reading
  - Green dot (•) marker on the left of the current chapter
  - Blank = unread
- Tap/click a chapter → navigate to it (lazy loads that chapter)
- **Close**: × button (top-right) or click outside the list or press Escape

### How to access:
- Subtle **hamburger button** (☰) fixed top-left, only visible during reading
- Keyboard: **Escape** key toggles TOC
- **No "กลับหน้าแรก" or "กลับไปอ่านต่อ" buttons** — removed for cleanliness

### Font
- สารบัญ title and บทที่ labels use **EkkamaiVibe** (Thai sans-serif), NOT monospace
- This ensures Thai text renders beautifully

---

## 🔖 Reading Progress — อ่านค้างไว้

The app **remembers the reader's progress** using `localStorage`:

### What is saved:
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
- **On chapter complete** (scroll > 90%): Mark as read automatically
- **On TOC**: Show read/unread/current status for each chapter
- **Home page**: Shows **"อ่านค้างไว้ — [chapter title]"** button for returning readers
- Uses `localStorage` — works offline too

---

## 🖼️ Images — รูปภาพ

### Current images
Images are stored in the **project root folder**:
- `SAP-01.png` — Chapter 1 hero image (Sap sitting by window with sprouts under starry sky)
- `SAP-02.png` — Chapter 2 hero image

### Image management
- All story images live in the **project folder**
- Images can be used in:
  - **Chapter hero images** — the main illustration per chapter
  - **Inline images** — within story blocks (`type: "image"`)
  - **Home screen** — featured on the landing/home page
- File names must be **exact** (case-sensitive for Vercel deployment)
- Images use `loading="lazy"` for performance (except hero which is `eager`)

---

## 📱 Add to Home Screen — PWA Icon

When users "Add to Home Screen" on iOS/Android, the app shows a **beautiful icon**.

### What's set up:
- **`manifest.json`** — PWA manifest with app name, icons, theme color, standalone display
- **`icons/`** folder — All icon sizes generated from `SAP-01.png`
  - `apple-touch-icon.png` (180×180) — iOS home screen
  - `icon-192.png` (192×192) — Android / Chrome
  - `icon-512.png` (512×512) — Splash screen / high-res
  - `favicon.ico`, `favicon-16.png`, `favicon-32.png` — Browser tabs
- **`sw.js`** — Service worker for offline caching (stale-while-revalidate strategy)

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

## 🏗️ Architecture — File Structure

```
/
├── index.html              # Clean HTML shell (~80 lines)
├── styles.css              # All CSS — design system, layout, components
├── app.js                  # All JS — reading engine, navigation, WebGL gradient
├── sw.js                   # Service worker (cache v2)
├── manifest.json           # PWA manifest
│
├── Claude.md               # This file — project vision & architecture
├── HOW-TO-START.md          # Setup guide
│
├── chapters/               # Chapter data (lazy loaded via JSONP)
│   ├── index.js            # Chapter manifest — lists all chapters
│   ├── chapter-1.js        # บทที่ 1 — คืนที่เบาที่สุด
│   └── chapter-2.js        # บทที่ 2 — ข้างนอกหน้าต่าง
│
├── characters/             # Character definitions (not currently loaded in UI)
│   ├── index.js
│   └── sap.js
│
├── EkkamaiVibe/            # Custom Thai+Latin font (5 weights)
│   ├── EkkamaiVibe-thin.ttf
│   ├── EkkamaiVibe-light.ttf
│   ├── EkkamaiVibe-Regular.ttf
│   ├── EkkamaiVibe-Bold.ttf
│   └── EkkamaiVibe-Heavy.ttf
│
├── icons/                  # PWA & favicon icons
│
├── SAP-01.png              # Hero image — chapter 1
├── SAP-02.png              # Hero image — chapter 2
└── .gitignore
```

### Key Design Decisions

1. **No framework** — Pure HTML/CSS/JS, static, deployable to Vercel as-is
2. **Separated files** — HTML is shell only; CSS and JS are external files for production cleanliness
3. **Lazy loading** — JSONP-style `loadScript()` to load chapters on demand
4. **localStorage** — Reading progress persistence (chapter, scroll %, read history)
5. **WebGL gradient** — Living animated background (simplex noise, 6-color palette)
6. **Grain texture** — SVG-based noise overlay for premium shadergradient.co-style texture
7. **Scroll-based reveal** — IntersectionObserver animations for content blocks
8. **Responsive** — Works on phone, tablet, and desktop
9. **No scroll text** — Scroll indicator is a minimal animated line + dot (no "↓ scroll" word)

---

## 🎨 Design Principles

- **Book feel** — The reader should forget they're on a website
- **Quiet** — No loud UI. No distracting navigation bars
- **Minimal** — Every element earns its place. If it doesn't serve the reading experience, remove it
- **Typography first** — Two font layers:
  - **EkkamaiVibe** (`--sans`) — The unified typeface for the entire reading experience (headings, body text, quotes, labels, Thai UI text). Local `.ttf`, 5 weights (Thin→Heavy). A contemporary Thai-Latin sans-serif.
  - **IBM Plex Mono** (`--mono`) — Used sparingly for English-only labels and metadata. Google Fonts.
- **Warm palette** — Paper tones, sage green (#6B9080), soft shadows
- **Living background** — WebGL gradient with grain texture (inspired by shadergradient.co)
- **Smooth transitions** — Fade between pages, scroll reveal for text blocks
- **Minimal chrome** — TOC button is subtle, only appears when reading

### What NOT to add:
- ❌ Character badges or character modal popups
- ❌ "กลับหน้าแรก" or "กลับไปอ่านต่อ" buttons
- ❌ Text-based scroll cues (like "↓ scroll")
- ❌ Permanent navbars or sidebars
- ❌ Page-based tap/swipe navigation (keep scroll)

---

## 🎨 Background — WebGL Gradient

The living gradient background is a key part of the visual identity:

### Palette (6 colors):
```
cA: warm cream base       — rgb(240, 231, 209)
cB: sage green (rich)     — rgb(107, 144, 127)
cC: light sage mist       — rgb(194, 212, 201)
cD: warm sand/amber       — rgb(232, 213, 191)
cE: mid sage              — rgb(158, 191, 179)
cF: dusty rose hint       — rgb(217, 199, 184)
```

### Technique:
- 2D simplex noise at 4 different scales/speeds
- Diagonal flow direction
- Smooth zone blending
- Subtle shimmer highlight
- Soft vignette toward edges
- **Grain texture overlay** (SVG fractalNoise, mix-blend-mode: overlay)
- Reduced veil opacity so gradient shines through

### Performance:
- Canvas renders at max 1.6x device pixel ratio
- `prefers-reduced-motion` → single static frame, no animation
- Runs at 60fps on modern devices

---

## 📋 Adding a New Chapter

### 1. Create the chapter file

Create `chapters/chapter-N.js`:

```js
// ── บทที่ N — [Title] ──

window.__SAP_CHAPTER__({
  chapter: N,
  title: "[Title]",
  subtitle: "[Subtitle]",
  heroImage: "IMAGE-FILE.png",      // optional
  heroCaption: "[Caption]",          // optional

  blocks: [
    { type: "text", body: "First paragraph...\nSecond line..." },
    { type: "quote", body: "A meaningful quote", by: "— ซิป" },
    { type: "image", src: "image-file.png", caption: "Description" },
    { type: "music", url: "https://open.spotify.com/track/..." }
  ]
});
```

### 2. Update the manifest

Add entry to `chapters/index.js`:

```js
window.__SAP_CHAPTERS__([
  { chapter: 1, title: "คืนที่เบาที่สุด", subtitle: "ฉากแรก" },
  { chapter: 2, title: "ข้างนอกหน้าต่าง", subtitle: "โลกที่มีทั้งคมและอุ่น" },
  { chapter: N, title: "[New Title]", subtitle: "[Subtitle]" }  // ← add here
]);
```

### 3. Update service worker cache

Add the new chapter file to `sw.js` ASSETS array and bump `CACHE_NAME` version.

### 4. Important reminders
- Use **"ซิป"** (not "Sap") for the character name in story text
- Use **"Sap"** only for branding/title
- Keep quote attributions as `"— ซิป"`

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
