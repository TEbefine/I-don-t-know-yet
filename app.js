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
      case "image": return `<div class="block b-image"><figure><img src="${esc(b.src)}" alt="${esc(b.caption||"")}" loading="lazy" />${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:""}</figure></div>`;
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
  window.addEventListener("scroll", () => {
    if (currentChapterNum > 0) {
      // Update progress bar
      const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      progressBar.style.width = (scrollPct * 100) + "%";

      // Debounced save
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(saveProgress, 400);

      // Mark chapter read near bottom
      if (scrollPct > 0.9) markChapterRead(currentChapterNum);
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
    canvas.style.background = "linear-gradient(135deg,#efe6d2 0%,#bcd0c9 40%,#6B9080 65%,#e1be9c 100%)";
    return;
  }

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const fs = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_t;

    /* richer palette — inspired by shadergradient warm-sage-cream */
    vec3 cA = vec3(0.941, 0.906, 0.820);   /* warm cream base        */
    vec3 cB = vec3(0.420, 0.565, 0.498);   /* sage green (richer)    */
    vec3 cC = vec3(0.760, 0.830, 0.790);   /* light sage mist        */
    vec3 cD = vec3(0.910, 0.835, 0.750);   /* warm sand/amber        */
    vec3 cE = vec3(0.620, 0.750, 0.700);   /* mid sage               */
    vec3 cF = vec3(0.850, 0.780, 0.720);   /* dusty rose hint        */

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
      uv.x *= aspect;
      float t = u_t * 0.08;  /* slightly faster movement */

      /* multiple noise layers at different scales and speeds */
      float n1 = snoise(uv * 1.2 + vec2(t * 0.35, t * 0.25))      * 0.5 + 0.5;
      float n2 = snoise(uv * 2.0 - vec2(t * 0.2, t * 0.3) + 5.0)  * 0.5 + 0.5;
      float n3 = snoise(uv * 0.7 + vec2(t * 0.15, -t * 0.18) + 10.0) * 0.5 + 0.5;
      float n4 = snoise(uv * 3.0 + vec2(-t * 0.1, t * 0.12) + 20.0) * 0.5 + 0.5;

      /* diagonal flow */
      float diag = (uv.x + uv.y) * 0.5;

      /* blend zones — stronger mixing for more visible color flow */
      float zone1 = smoothstep(0.15, 0.65, diag + n1 * 0.45 - 0.15);
      float zone2 = smoothstep(0.2, 0.75, n2 + diag * 0.35);
      float zone3 = smoothstep(0.2, 0.7, n3);
      float zone4 = smoothstep(0.3, 0.8, n4 * 0.7 + diag * 0.3);

      /* build color — more visible tinting */
      vec3 col = cA;
      col = mix(col, cD, zone1 * 0.40);       /* warm sand sweep   */
      col = mix(col, cB, zone2 * 0.30);       /* sage green blobs  */
      col = mix(col, cC, zone3 * 0.25);       /* light sage mist   */
      col = mix(col, cE, (1.0 - zone1) * n3 * 0.20); /* mid sage pockets */
      col = mix(col, cF, zone4 * 0.15);       /* dusty warmth      */

      /* subtle highlight shimmer */
      float shimmer = snoise(uv * 4.0 + vec2(t * 0.5, t * 0.3)) * 0.5 + 0.5;
      col += vec3(0.02) * shimmer * (1.0 - zone1);

      /* soft vignette */
      vec2 vc = gl_FragCoord.xy / u_res - 0.5;
      col = mix(col, cA, smoothstep(0.25, 1.0, length(vc)) * 0.45);

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
