/* ═══════════════════════════════════════════
   SAP — app.js
   Scroll-based reading engine
   ═══════════════════════════════════════════ */

(function () {
  "use strict";

  const APP = { title: "Sap", signature: "SAP by Teera" };

  /* ── State ── */
  let chapterList = [];
  let currentChapter = null;
  let currentChapterNum = 0;

  /* ── DOM ── */
  const tocPage      = document.getElementById("toc-page");
  const tocListEl    = document.getElementById("toc-list");
  const tocBtn       = document.getElementById("toc-btn");
  const tocClose     = document.getElementById("toc-close");

  const chapterView  = document.getElementById("chapter-view");
  const titleEl      = document.getElementById("title");
  const subtitleEl   = document.getElementById("subtitle");
  const eyebrowEl    = document.getElementById("eyebrow");
  const heroFig      = document.getElementById("heroFig");
  const heroImg      = document.getElementById("heroImg");
  const heroCap      = document.getElementById("heroCap");
  const mainEl       = document.getElementById("main");
  const navPrev      = document.getElementById("nav-prev");
  const navNext      = document.getElementById("nav-next");
  const navPrevLabel = document.getElementById("nav-prev-label");
  const navNextLabel = document.getElementById("nav-next-label");
  const progressBar  = document.getElementById("progress-bar");


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

  function renderBlock(b) {
    switch (b.type) {
      case "text":  return `<div class="block b-text"><p>${esc(b.body).replace(/\n/g,"<br>")}</p></div>`;
      case "quote": return `<div class="block b-quote"><span class="mark">&ldquo;</span><blockquote>${esc(b.body)}</blockquote>${b.by?`<cite>${esc(b.by)}</cite>`:""}</div>`;
      case "image": return `<div class="block b-image"><figure><img src="${esc(b.src)}" alt="${esc(b.caption||"")}" loading="lazy" decoding="async" />${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:""}</figure></div>`;
      case "music": return `<div class="block b-music"><div class="label">now playing</div><div class="frame">${musicEmbed(b.url)}</div></div>`;
      default:      return "";
    }
  }

  /* ── Scroll Reveal (IntersectionObserver) ── */
  function observeBlocks() {
    const blocks = document.querySelectorAll(".block");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("seen");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.18 });
      blocks.forEach(b => io.observe(b));
    } else {
      blocks.forEach(b => b.classList.add("seen"));
    }
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
    const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    const chaptersRead = getProgress().chaptersRead || [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentChapter: currentChapterNum,
      currentScrollPosition: Math.min(1, Math.max(0, scrollPct)),
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
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { currentChapter: 0, currentScrollPosition: 0, chaptersRead: [] };
    } catch { return { currentChapter: 0, currentScrollPosition: 0, chaptersRead: [] }; }
  }

  /* ── Scroll listener: save progress + progress bar + mark read ── */
  let scrollTimer;
  let scrollTicking = false;
  window.addEventListener("scroll", () => {
    if (currentChapterNum > 0 && !scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        // Update progress bar
        const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
        progressBar.style.width = (scrollPct * 100) + "%";

        // Mark chapter read near bottom
        if (scrollPct > 0.9) markChapterRead(currentChapterNum);

        scrollTicking = false;
      });

      // Debounced save (outside rAF — doesn't need rendering)
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(saveProgress, 400);
    }
  });

  /* ═══════════════════════════════════════════
     PAGE ROUTING
     ═══════════════════════════════════════════ */

  function showPage(pageId) {
    chapterView.classList.remove("active");
    tocPage.classList.remove("active");
    progressBar.classList.remove("visible");
    tocBtn.classList.remove("visible");

    if (pageId === "chapter") {
      chapterView.classList.add("active");
      document.body.style.overflow = "";
      progressBar.classList.add("visible");
      tocBtn.classList.add("visible");
    } else if (pageId === "toc") {
      tocPage.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  /* ═══════════════════════════════════════════
     CHAPTER RENDERING
     ═══════════════════════════════════════════ */

  function renderChapter(data) {
    currentChapter = data;
    currentChapterNum = data.chapter;

    // Header
    eyebrowEl.textContent = `บทที่ ${data.chapter}`;
    titleEl.textContent = data.title || APP.title;
    subtitleEl.textContent = data.subtitle || "";
    document.title = `${data.title} — ${APP.title}`;

    // Hero image
    if (data.heroImage) {
      const show = () => { heroFig.hidden = false; heroFig.classList.add("seen"); };
      heroImg.onload = show;
      heroImg.onerror = () => { heroFig.hidden = true; };
      heroImg.alt = data.heroCaption || "";
      heroImg.decoding = "async";
      heroImg.src = data.heroImage;
      heroCap.textContent = data.heroCaption || "";
      heroFig.hidden = false;
      heroFig.classList.remove("seen");
      if (heroImg.complete && heroImg.naturalWidth > 0) show();
      setTimeout(() => { if (heroImg.naturalWidth > 0) show(); }, 1500);
    } else {
      heroFig.hidden = true;
    }

    // Blocks
    mainEl.innerHTML = (data.blocks || []).map(renderBlock).join(`<div class="divider"></div>`);
    observeBlocks();

    // Navigation
    updateNav();

    // Reset progress bar
    progressBar.style.width = "0%";

    // Save
    saveProgress();
  }

  function updateNav() {
    const idx = chapterList.findIndex(c => c.chapter === currentChapterNum);
    const prev = idx > 0 ? chapterList[idx - 1] : null;
    const next = idx < chapterList.length - 1 ? chapterList[idx + 1] : null;

    if (prev) {
      navPrev.disabled = false;
      navPrevLabel.textContent = `บทที่ ${prev.chapter}`;
      navPrev.onclick = () => { loadChapter(prev.chapter); window.scrollTo(0, 0); };
    } else {
      navPrev.disabled = true;
    }

    if (next) {
      navNext.disabled = false;
      navNextLabel.textContent = `บทที่ ${next.chapter}`;
      navNext.onclick = () => { loadChapter(next.chapter); window.scrollTo(0, 0); };
    } else {
      navNext.disabled = true;
    }
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
          window.scrollTo(0, 0);
        });
      });
    });
  }

  tocBtn.addEventListener("click", () => { buildTOC(); showPage("toc"); });

  tocClose.addEventListener("click", () => {
    showPage("chapter");
  });

  tocPage.addEventListener("click", (e) => {
    if (e.target === tocPage) {
      showPage("chapter");
    }
  });

  /* ── Keyboard shortcut ── */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (tocPage.classList.contains("active")) {
        showPage("chapter");
      } else if (chapterView.classList.contains("active")) {
        buildTOC(); showPage("toc");
      }
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
        mainEl.innerHTML = `<div class="block b-text seen"><p>ไม่พบบทที่ ${n}</p></div>`;
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
    const startChapter = progress.currentChapter > 0 ? progress.currentChapter : 1;

    loadChapter(startChapter).then(() => {
      showPage("chapter");
      if (progress.currentChapter > 0 && progress.currentScrollPosition > 0) {
        setTimeout(() => {
          const target = progress.currentScrollPosition * (document.body.scrollHeight - window.innerHeight);
          window.scrollTo(0, target);
        }, 300);
      }
    });
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
     WEBGL LIVING GRADIENT — shadergradient.co inspired
     More vibrant, more movement, more alive
     ═══════════════════════════════════════════ */

  const canvas = document.getElementById("gradient");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) {
    canvas.style.background = "linear-gradient(135deg, #f7f5f0 0%, #d4e6db 40%, #e8d8c4 60%, #f2efe8 100%)";
    return;
  }

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const fs = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_t;

    /* expanded palette — more separation for visible flow */
    vec3 c1 = vec3(0.965, 0.957, 0.940);   /* warm cream  #F7F4F0   */
    vec3 c2 = vec3(0.830, 0.900, 0.855);   /* sage green  #D4E6DA   */
    vec3 c3 = vec3(0.880, 0.920, 0.895);   /* soft mint   #E1EBE4   */
    vec3 c4 = vec3(0.920, 0.890, 0.840);   /* warm honey  #EBE3D6   */
    vec3 c5 = vec3(0.820, 0.870, 0.850);   /* deep sage   #D1DED9   */
    vec3 c6 = vec3(0.910, 0.870, 0.810);   /* warm amber  #E8DEC9   */

    /* simplex noise */
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
      float aspect = u_res.x / u_res.y;
      vec2 p = uv;
      p.x *= aspect;

      /* faster, dreamier movement */
      float t = u_t * 0.06;

      /* breathing pulse — the whole scene gently inhales/exhales */
      float breathe = sin(t * 0.4) * 0.5 + 0.5;

      /* primary large undulations */
      float w1 = snoise(p * 0.7 + vec2(t * 0.22, t * 0.15))        * 0.5 + 0.5;
      float w2 = snoise(p * 0.9 - vec2(t * 0.14, -t * 0.18) + 4.0) * 0.5 + 0.5;
      float w3 = snoise(p * 0.5 + vec2(-t * 0.12, t * 0.16) + 8.0) * 0.5 + 0.5;
      float w4 = snoise(p * 1.1 + vec2(t * 0.10, t * 0.20) + 12.0) * 0.5 + 0.5;

      /* secondary detail octave — fine ripples */
      float d1 = snoise(p * 1.8 + vec2(t * 0.30, -t * 0.25) + 20.0) * 0.5 + 0.5;
      float d2 = snoise(p * 2.2 - vec2(t * 0.20, t * 0.35) + 28.0) * 0.5 + 0.5;

      /* diagonal flow */
      float diag = (p.x * 0.707 + p.y * 0.707);

      /* blend zones with more contrast */
      float f1 = smoothstep(0.15, 0.85, w1 + diag * 0.25);
      float f2 = smoothstep(0.20, 0.80, w2 * 0.55 + w3 * 0.45);
      float f3 = smoothstep(0.20, 0.80, w3 + (1.0 - diag) * 0.20);
      float f4 = smoothstep(0.15, 0.85, w4 * 0.5 + w1 * 0.5);
      float fd = smoothstep(0.3, 0.7, d1 * 0.6 + d2 * 0.4);

      /* richer color blending — visible but still peaceful */
      vec3 col = c1;                                /* warm cream base     */
      col = mix(col, c2, f1 * 0.55);                /* sage green wash     */
      col = mix(col, c3, f2 * 0.50);                /* soft mint flow      */
      col = mix(col, c4, (1.0 - f1) * 0.45);        /* warm honey areas    */
      col = mix(col, c5, f3 * f4 * 0.40);            /* deep sage pockets   */
      col = mix(col, c6, fd * 0.30 * breathe);       /* amber glow breathes */
      col = mix(col, c1, f4 * 0.18);                /* cream highlights    */

      /* subtle detail shimmer from second octave */
      col += (d1 - 0.5) * 0.025;

      /* soft vignette */
      vec2 vc = gl_FragCoord.xy / u_res - 0.5;
      col = mix(col, c1, smoothstep(0.3, 1.1, length(vc)) * 0.30);

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
    /* DPR capped at 1.0 — background doesn't need Retina, massive GPU savings */
    const dpr = 1.0;
    canvas.width  = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });
  resize();

  const start = performance.now();
  let lastFrame = 0;
  function frame(now) {
    /* Skip frames if device is struggling (< 20fps) */
    const delta = now - lastFrame;
    if (delta < 16) { requestAnimationFrame(frame); return; }
    lastFrame = now;

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
