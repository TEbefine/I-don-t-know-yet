/* ═══════════════════════════════════════════
   SAP — app.js
   Page-based reading engine
   ═══════════════════════════════════════════ */

(function () {
  "use strict";

  const APP = { title: "Sap", signature: "SAP by Teera" };

  /* ── State ── */
  let chapterList = [];
  let currentChapter = null;
  let currentChapterNum = 0;
  let pages = [];          // array of page DOM nodes
  let currentPageIdx = 0;  // which page is showing

  /* ── DOM ── */
  const tocPage      = document.getElementById("toc-page");
  const tocListEl    = document.getElementById("toc-list");
  const tocBtn       = document.getElementById("toc-btn");
  const tocClose     = document.getElementById("toc-close");
  const homePage     = document.getElementById("home-page");
  const chapterView  = document.getElementById("chapter-view");
  const stage        = document.getElementById("stage");
  const progressBar  = document.getElementById("progress-bar");
  const pageCounter  = document.getElementById("page-counter");
  const homeResume   = document.getElementById("home-resume");
  const tapPrev      = document.getElementById("tap-prev");
  const tapNext      = document.getElementById("tap-next");

  /* ── Helpers ── */
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function musicEmbed(url) {
    url = (url || "").trim();
    let m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if (m) return `<iframe src="https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0" height="${m[1]==='track'?152:352}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
    m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return `<iframe src="https://www.youtube.com/embed/${m[1]}?rel=0" height="315" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    return `<div style="padding:24px;text-align:center;font-size:13px;color:var(--ink-faint)">paste a Spotify or YouTube link</div>`;
  }

  /* ── Script Loader (JSONP-style) ── */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  /* ═══════════════════════════════════════════
     PROGRESS PERSISTENCE
     ═══════════════════════════════════════════ */

  const STORAGE_KEY = "sap_reading_progress";

  function saveProgress() {
    const chaptersRead = getProgress().chaptersRead || [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentChapter: currentChapterNum,
      currentPage: currentPageIdx,
      totalPages: pages.length,
      chaptersRead,
      lastReadAt: new Date().toISOString()
    }));
  }

  function markChapterRead(n) {
    const p = getProgress();
    if (!p.chaptersRead.includes(n)) {
      p.chaptersRead.push(n);
      p.chaptersRead.sort((a, b) => a - b);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { currentChapter: 0, currentPage: 0, chaptersRead: [] };
    } catch { return { currentChapter: 0, currentPage: 0, chaptersRead: [] }; }
  }

  /* ═══════════════════════════════════════════
     PAGE ROUTING
     ═══════════════════════════════════════════ */

  function showPage(pageId) {
    homePage.classList.remove("active");
    chapterView.classList.remove("active");
    tocPage.classList.remove("active");
    progressBar.classList.remove("visible");
    pageCounter.classList.remove("visible");
    tocBtn.classList.remove("visible");

    if (pageId === "home") {
      homePage.classList.add("active");
      updateHomeResume();
    } else if (pageId === "chapter") {
      chapterView.classList.add("active");
      progressBar.classList.add("visible");
      pageCounter.classList.add("visible");
      tocBtn.classList.add("visible");
    } else if (pageId === "toc") {
      tocPage.classList.add("active");
    }
  }

  function updateHomeResume() {
    const p = getProgress();
    if (p.currentChapter > 0) {
      const ch = chapterList.find(c => c.chapter === p.currentChapter);
      if (ch) {
        homeResume.textContent = `อ่านค้างไว้ — ${ch.title}`;
        homeResume.classList.add("visible");
        return;
      }
    }
    homeResume.classList.remove("visible");
  }

  /* ═══════════════════════════════════════════
     PAGE-BASED NAVIGATION ENGINE
     ═══════════════════════════════════════════ */

  function updateProgressUI() {
    if (pages.length <= 1) {
      progressBar.style.width = "100%";
      pageCounter.textContent = "";
      return;
    }
    const pct = ((currentPageIdx + 1) / pages.length) * 100;
    progressBar.style.width = pct + "%";
    pageCounter.textContent = `${currentPageIdx + 1} / ${pages.length}`;
  }

  function goToPage(idx, direction) {
    if (idx < 0 || idx >= pages.length) return;

    const prev = pages[currentPageIdx];
    const next = pages[idx];

    if (prev && prev !== next) {
      prev.classList.remove("active");
      prev.classList.add(direction === "forward" ? "exit-left" : "exit-right");
      // Clean up exit class after transition
      setTimeout(() => {
        prev.classList.remove("exit-left", "exit-right");
      }, 600);
    }

    // Prepare entry
    next.classList.remove("exit-left", "exit-right");
    if (direction === "forward") {
      next.style.transform = "translateX(40px)";
    } else {
      next.style.transform = "translateX(-40px)";
    }

    // Force reflow
    void next.offsetWidth;

    // Animate in
    next.style.transform = "";
    next.classList.add("active");

    currentPageIdx = idx;
    updateProgressUI();
    saveProgress();

    // If user reached the last page, mark chapter as read
    if (currentPageIdx === pages.length - 1) {
      markChapterRead(currentChapterNum);
    }
  }

  function nextPage() {
    if (currentPageIdx < pages.length - 1) {
      goToPage(currentPageIdx + 1, "forward");
    }
  }

  function prevPage() {
    if (currentPageIdx > 0) {
      goToPage(currentPageIdx - 1, "backward");
    }
  }

  /* ── Tap navigation ── */
  tapNext.addEventListener("click", (e) => {
    e.stopPropagation();
    nextPage();
  });

  tapPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    prevPage();
  });

  /* ── Keyboard navigation ── */
  document.addEventListener("keydown", (e) => {
    if (!chapterView.classList.contains("active")) return;
    if (tocPage.classList.contains("active")) return;

    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      nextPage();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevPage();
    } else if (e.key === "Escape") {
      e.preventDefault();
      buildTOC();
      showPage("toc");
    }
  });

  /* ── Swipe navigation (touch) ── */
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  chapterView.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  chapterView.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // Only count horizontal swipes (not vertical scroll attempts)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) nextPage();    // swipe left → next
      else        prevPage();    // swipe right → prev
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════
     CHAPTER RENDERING — Build Pages
     ═══════════════════════════════════════════ */

  function buildPages(data) {
    stage.innerHTML = "";
    pages = [];
    currentPageIdx = 0;

    // Page 0: Title page
    const titlePage = createPage("page-title");
    titlePage.innerHTML = `
      <div class="page-eyebrow">บทที่ ${data.chapter}</div>
      <h1 class="page-h1">${esc(data.title)}</h1>
      ${data.subtitle ? `<p class="page-subtitle">${esc(data.subtitle)}</p>` : ""}
      <div class="page-tap-hint">แตะเพื่ออ่านต่อ</div>
    `;
    pages.push(titlePage);

    // Page 1: Hero image (if exists)
    if (data.heroImage) {
      const heroPage = createPage("page-image");
      heroPage.innerHTML = `
        <figure>
          <img class="page-hero-img" src="${esc(data.heroImage)}" alt="${esc(data.heroCaption || "")}" loading="eager" />
          ${data.heroCaption ? `<figcaption class="page-hero-caption">${esc(data.heroCaption)}</figcaption>` : ""}
        </figure>
      `;
      pages.push(heroPage);
    }

    // Content block pages
    (data.blocks || []).forEach(b => {
      switch (b.type) {
        case "text": {
          const p = createPage("page-text-wrap");
          p.innerHTML = `<p class="page-text">${esc(b.body).replace(/\n/g, "<br>")}</p>`;
          pages.push(p);
          break;
        }
        case "quote": {
          const p = createPage("page-quote");
          p.innerHTML = `
            <span class="mark">&ldquo;</span>
            <blockquote>${esc(b.body)}</blockquote>
            ${b.by ? `<cite>${esc(b.by)}</cite>` : ""}
          `;
          pages.push(p);
          break;
        }
        case "image": {
          const p = createPage("page-image");
          p.innerHTML = `
            <figure>
              <img src="${esc(b.src)}" alt="${esc(b.caption || "")}" loading="lazy" />
              ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
            </figure>
          `;
          pages.push(p);
          break;
        }
        case "music": {
          const p = createPage("page-music");
          p.innerHTML = `
            <div class="label">now playing</div>
            <div class="frame">${musicEmbed(b.url)}</div>
          `;
          pages.push(p);
          break;
        }
      }
    });

    // Last page: End of chapter
    const endPage = createPage("page-end");
    const idx = chapterList.findIndex(c => c.chapter === data.chapter);
    const nextCh = idx < chapterList.length - 1 ? chapterList[idx + 1] : null;

    endPage.innerHTML = `
      <div class="divider"></div>
      <div class="sig">${esc(APP.signature)}</div>
      <div class="breathe">breathe ◦ you're okay</div>
      <div class="page-end-nav">
        ${nextCh ? `<button class="page-end-btn" id="end-next-ch">บทถัดไป →</button>` : ""}
        <button class="page-end-btn" id="end-toc">สารบัญ</button>
      </div>
    `;
    pages.push(endPage);

    // Append all pages to stage
    pages.forEach(p => stage.appendChild(p));

    // Activate first page
    pages[0].classList.add("active");

    // Wire up end-of-chapter buttons
    const nextBtn = document.getElementById("end-next-ch");
    if (nextBtn && nextCh) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        loadChapter(nextCh.chapter).then(() => {
          showPage("chapter");
        });
      });
    }

    const tocEndBtn = document.getElementById("end-toc");
    if (tocEndBtn) {
      tocEndBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        buildTOC();
        showPage("toc");
      });
    }

    updateProgressUI();
  }

  function createPage(extraClass) {
    const div = document.createElement("div");
    div.className = "page" + (extraClass ? " " + extraClass : "");
    return div;
  }

  function renderChapter(data) {
    currentChapter = data;
    currentChapterNum = data.chapter;
    document.title = `${data.title} — ${APP.title}`;
    buildPages(data);
    saveProgress();
  }

  /* ═══════════════════════════════════════════
     TABLE OF CONTENTS
     ═══════════════════════════════════════════ */

  function buildTOC() {
    const progress = getProgress();
    tocListEl.innerHTML = chapterList.map(ch => {
      const isRead = progress.chaptersRead.includes(ch.chapter);
      const isCurrent = ch.chapter === currentChapterNum;
      const status = isRead ? "✓" : isCurrent ? "→" : "";
      const currentClass = isCurrent ? " is-current" : "";

      return `<li class="toc-item${currentClass}" data-chapter="${ch.chapter}">
        <span class="toc-num">บทที่ ${ch.chapter}</span>
        <span class="toc-info">
          <div class="toc-info-title">${esc(ch.title)}</div>
          <div class="toc-info-sub">${esc(ch.subtitle)}</div>
        </span>
        <span class="toc-status">${status}</span>
      </li>`;
    }).join("");

    tocListEl.querySelectorAll(".toc-item").forEach(item => {
      item.addEventListener("click", () => {
        const n = parseInt(item.dataset.chapter);
        loadChapter(n).then(() => {
          showPage("chapter");
        });
      });
    });
  }

  /* ── TOC Events ── */
  tocBtn.addEventListener("click", () => {
    buildTOC();
    showPage("toc");
  });

  tocClose.addEventListener("click", () => {
    if (currentChapterNum > 0) {
      showPage("chapter");
    } else {
      showPage("home");
    }
  });

  // Click outside TOC list to close
  tocPage.addEventListener("click", (e) => {
    if (e.target === tocPage) {
      if (currentChapterNum > 0) {
        showPage("chapter");
      } else {
        showPage("home");
      }
    }
  });

  /* ═══════════════════════════════════════════
     HOME PAGE
     ═══════════════════════════════════════════ */

  document.getElementById("home-start-btn").addEventListener("click", () => {
    loadChapter(1).then(() => showPage("chapter"));
  });

  document.getElementById("home-toc-btn").addEventListener("click", () => {
    buildTOC();
    showPage("toc");
  });

  homeResume.addEventListener("click", () => {
    const p = getProgress();
    if (p.currentChapter > 0) {
      loadChapter(p.currentChapter).then(() => {
        showPage("chapter");
        // Restore page position
        if (p.currentPage > 0 && p.currentPage < pages.length) {
          setTimeout(() => goToPage(p.currentPage, "forward"), 100);
        }
      });
    }
  });

  /* ═══════════════════════════════════════════
     LAZY CHAPTER LOADING
     ═══════════════════════════════════════════ */

  function loadChapter(n) {
    return new Promise((resolve) => {
      window.__SAP_CHAPTER__ = (data) => {
        renderChapter(data);
        resolve(data);
      };
      loadScript(`chapters/chapter-${n}.js`).catch(() => {
        stage.innerHTML = `<div class="page active page-text-wrap"><p class="page-text">ไม่พบบทที่ ${n}</p></div>`;
        resolve(null);
      });
    });
  }

  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */

  window.__SAP_CHAPTERS__ = (list) => {
    chapterList = list;
    buildTOC();

    const progress = getProgress();

    if (progress.currentChapter > 0) {
      // Returning reader — resume
      loadChapter(progress.currentChapter).then(() => {
        showPage("chapter");
        if (progress.currentPage > 0 && progress.currentPage < pages.length) {
          setTimeout(() => goToPage(progress.currentPage, "forward"), 150);
        }
      });
    } else {
      // First visit — home page
      showPage("home");
    }
  };

  loadScript("chapters/index.js").catch(() => {
    chapterList = [{ chapter: 1, title: "คืนที่เบาที่สุด", subtitle: "ฉากแรก" }];
    loadChapter(1).then(() => showPage("chapter"));
  });

  /* ═══════════════════════════════════════════
     SERVICE WORKER
     ═══════════════════════════════════════════ */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => console.log("SW registered", reg.scope))
        .catch(err => console.log("SW failed", err));
    });
  }

  /* ═══════════════════════════════════════════
     WEBGL LIVING GRADIENT (shadergradient-inspired)
     ═══════════════════════════════════════════ */

  const canvas = document.getElementById("gradient");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) {
    canvas.style.background = "linear-gradient(135deg,#efe6d2 0%,#bcd0c9 40%,#6B9080 65%,#e1be9c 100%)";
    return;
  }

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const fs = `
    precision highp float;
    uniform vec2 u_res; uniform float u_t;

    vec3 cA = vec3(0.937, 0.902, 0.823);
    vec3 cB = vec3(0.855, 0.890, 0.870);
    vec3 cC = vec3(0.900, 0.920, 0.910);
    vec3 cD = vec3(0.925, 0.880, 0.835);
    vec3 cE = vec3(0.880, 0.900, 0.890);

    vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289v2(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x){ return mod289((x * 34.0 + 1.0) * x); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289v2(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                   + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                               dot(x12.zw,x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x_) - 0.5;
      vec3 ox = floor(x_ + 0.5);
      vec3 a0 = x_ - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.x *= u_res.x / u_res.y;
      float t = u_t * 0.06;

      float diag = (uv.x + uv.y) * 0.5;

      float n1 = snoise(uv * 1.4 + vec2(t * 0.3, t * 0.2)) * 0.5 + 0.5;
      float n2 = snoise(uv * 2.2 - vec2(t * 0.15, t * 0.25) + 5.0) * 0.5 + 0.5;
      float n3 = snoise(uv * 0.8 + vec2(t * 0.1, -t * 0.12) + 10.0) * 0.5 + 0.5;

      float zone1 = smoothstep(0.2, 0.7, diag + n1 * 0.4 - 0.15);
      float zone2 = smoothstep(0.3, 0.8, n2 + diag * 0.3);
      float zone3 = smoothstep(0.25, 0.75, n3);

      vec3 col = cA;
      col = mix(col, cD, zone1 * 0.25);
      col = mix(col, cB, zone2 * 0.2);
      col = mix(col, cC, zone3 * 0.15);
      col = mix(col, cE, (1.0 - zone1) * n3 * 0.12);

      vec2 vc = gl_FragCoord.xy / u_res - 0.5;
      col = mix(col, cA, smoothstep(0.3, 1.0, length(vc)) * 0.55);

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(t, s) {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    return sh;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uT   = gl.getUniformLocation(prog, "u_t");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width  = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resize);
  resize();

  const start = performance.now();
  function frame(now) {
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    gl.uniform1f(uT, 8.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    requestAnimationFrame(frame);
  }

})();
