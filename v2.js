/* Hipspace v2 — experiment. Halftone field + GSAP/Lenis motion. */
(() => {
  const MOTION = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOVER = matchMedia('(hover: hover)').matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (!HAS_GSAP) document.documentElement.classList.add('motion-failsafe');

  /* ---------------------------------------------------------------
     HALFTONE / DITHER FIELD
     A slow flowing noise sets each cell's tone; a 4×4 Bayer matrix
     dithers that tone into a handful of dot sizes, so the field moves
     in visible steps like a printed halftone. Under the pointer the loop
     from the house mark writes itself out in pink dots and sends out waves
     in its own shape.
     --------------------------------------------------------------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  /* The loop from the house mark (assets/sara.svg) as one stroke: its centre
     line, traced from the outlined file, so it can be drawn on and used as a
     brush. Frame and stroke width match the file. */
  const SARA = {
    w: 3522, h: 2123, stroke: 313,
    d: "M359 157C365 157 382 156 393 156C404 156 415 155 426 156C437 156 448 157 459 158C470 160 481 162 492 164C503 166 513 169 524 173C534 176 545 180 555 185C565 189 574 194 585 200C595 206 606 212 619 220C631 229 647 240 661 251C675 262 689 273 702 284C715 296 728 308 741 320C754 332 766 344 778 357C790 370 802 383 814 396C825 409 836 423 847 437C858 451 870 467 878 480C886 492 890 503 895 513C900 524 903 532 906 542C910 551 914 561 918 570C922 580 925 589 929 599C933 608 936 618 940 628C943 637 947 647 950 657C953 666 956 676 960 686C963 695 963 693 969 715C974 737 988 784 995 819C1002 854 1007 890 1010 926C1014 961 1016 997 1015 1033C1015 1069 1013 1105 1009 1140C1005 1176 998 1211 991 1246C983 1281 974 1316 963 1350C952 1384 938 1419 925 1450C912 1482 897 1512 885 1537C874 1562 865 1579 855 1600C845 1621 835 1642 824 1662C813 1683 802 1704 790 1724C778 1744 766 1763 752 1782C739 1801 724 1820 709 1837C693 1854 676 1871 658 1885C640 1900 618 1914 600 1924C582 1933 567 1939 552 1944C537 1949 525 1953 511 1956C496 1959 482 1961 468 1963C454 1965 439 1966 425 1966C410 1967 396 1967 382 1965C367 1964 353 1962 339 1960C325 1957 311 1953 297 1948C284 1943 270 1937 258 1929C247 1922 237 1913 228 1903C219 1894 211 1883 204 1872C197 1861 191 1849 185 1837C180 1825 175 1812 171 1799C167 1787 164 1774 162 1761C159 1748 157 1734 155 1721C154 1708 151 1699 152 1681C153 1664 146 1652 160 1616C174 1580 207 1515 235 1468C264 1421 298 1376 331 1332C365 1288 401 1245 437 1203C474 1161 511 1120 550 1080C588 1040 628 1001 668 963C709 925 750 887 793 852C835 816 881 780 924 748C966 716 1008 687 1050 660C1093 633 1134 608 1178 585C1221 562 1266 540 1311 522C1357 504 1404 488 1452 477C1499 465 1549 457 1598 455C1646 454 1697 457 1744 468C1791 479 1839 497 1881 522C1923 546 1973 595 1996 614C2018 633 2010 629 2017 636C2024 643 2031 650 2039 657C2046 664 2053 671 2061 678C2068 685 2076 692 2083 699C2090 706 2098 712 2105 719C2112 726 2120 733 2127 740C2134 748 2139 752 2148 762C2158 771 2168 781 2183 798C2199 815 2224 842 2242 866C2261 889 2279 913 2295 938C2312 963 2327 989 2340 1016C2352 1043 2364 1072 2372 1100C2379 1129 2385 1159 2387 1188C2389 1218 2388 1249 2384 1278C2380 1307 2369 1342 2362 1365C2354 1388 2346 1402 2339 1416C2331 1429 2324 1437 2315 1446C2306 1455 2296 1464 2286 1471C2276 1479 2265 1485 2253 1491C2242 1497 2230 1502 2218 1506C2206 1509 2193 1512 2180 1515C2168 1517 2155 1518 2142 1518C2129 1518 2118 1518 2103 1516C2088 1514 2069 1510 2053 1504C2036 1499 2020 1492 2004 1485C1989 1477 1974 1468 1960 1458C1946 1447 1932 1435 1921 1423C1911 1411 1903 1398 1898 1388C1893 1377 1892 1369 1891 1359C1891 1350 1891 1342 1895 1330C1899 1319 1905 1308 1914 1289C1924 1271 1938 1243 1950 1220C1962 1197 1973 1174 1984 1150C1995 1127 2006 1104 2017 1080C2028 1057 2039 1033 2050 1010C2061 986 2072 963 2083 939C2094 916 2105 892 2116 869C2128 846 2136 828 2151 799C2166 771 2184 733 2206 697C2227 661 2251 620 2277 583C2303 546 2330 510 2360 477C2390 443 2422 411 2457 383C2492 355 2529 329 2568 307C2607 285 2649 266 2691 251C2733 236 2777 225 2821 217C2865 208 2925 203 2955 200C2985 198 2987 199 3002 200C3018 201 3034 202 3049 205C3065 207 3080 211 3096 215C3111 220 3126 225 3140 232C3154 238 3168 246 3182 254C3195 262 3208 271 3221 281C3233 291 3245 302 3256 312C3267 323 3277 334 3285 344C3294 353 3300 361 3306 370C3313 379 3319 389 3325 399C3331 408 3337 418 3341 429C3346 439 3351 449 3354 460C3358 471 3361 482 3363 493C3366 504 3368 515 3369 526C3370 538 3370 549 3370 560C3371 572 3370 584 3369 596C3368 608 3367 620 3366 632C3364 644 3362 656 3360 668C3358 680 3355 692 3352 704C3349 715 3345 727 3341 738C3337 750 3332 761 3326 772C3321 782 3315 793 3308 803C3301 812 3297 818 3286 828C3276 838 3258 851 3244 862C3229 873 3214 883 3199 893C3184 903 3168 912 3153 921C3137 930 3121 939 3105 948C3089 956 3073 964 3057 972C3040 980 3024 988 3007 996C2991 1003 2972 1012 2958 1018C2944 1025 2930 1031 2925 1033"
  };

  /* The loop's centre line measured once: its length (for writing it out with
     a dash) and 360 points along it, normalised to its bounding box, so it can
     be redrawn stretched or straightened. Each point: [x 0…1, y −.5….5, t 0…1]. */
  const { SARA_LEN, SARA_PTS, SARA_ASPECT } = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    svg.style.cssText = 'position:absolute;width:0;height:0';
    p.setAttribute('d', SARA.d);
    svg.append(p); document.body.append(svg);
    const L = p.getTotalLength(), b = p.getBBox(), pts = [];
    for (let i = 0; i <= 360; i++) {
      const q = p.getPointAtLength(L * i / 360);
      pts.push([(q.x - b.x) / b.width, (q.y - b.y) / b.height - .5, i / 360]);
    }
    svg.remove();
    return { SARA_LEN: L, SARA_PTS: pts, SARA_ASPECT: b.width / b.height };
  })();

  function halftone(canvas) {
    // 'hero' reacts to the pointer; 'soft' and 'calm' just drift ('calm' in finer, fainter dots)
    const calm = canvas.dataset.halftone === 'calm';
    const soft = calm || canvas.dataset.halftone === 'soft';
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const LEVELS = 6;
    let w = 0, h = 0, cell = 11, running = false, raf = 0, lastT = 0, travel = 0;
    let quiet = null;                // the box behind the intro text, where the dots stay small
    const t0 = performance.now();
    const ptr = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, s: 0, on: false };

    /* The pointer is a pen: moving it writes the loop out along its length.
       Stop and it slowly un-writes; finish it and it sends waves out in its
       own shape, holds for a moment, wipes itself and waits to be written again. */
    const pen = { f: 0, mode: 'write', hold: 0, still: 0, drawn: -1, map: null };
    const WRITE_PX = 1500;           // pointer travel that writes the whole loop
    const waves = [], WAVE_SPEED = 260, WAVE_LIFE = .85;
    let field = null;                // distance to the full loop, for the shaped waves
    // the pen and field canvases are made once and reused: on phones the address
    // bar resizes the hero on every scroll, and fresh canvases each time pile up
    // until the browser (iOS Safari especially) blanks the field
    let penSize = 0, penCanvas = null, fieldCanvas = null;

    function makePen(width) {
      const RES = .5, pad = 10, k = width / SARA.w;
      const c = penCanvas || (penCanvas = document.createElement('canvas'));
      c.width = Math.ceil((width + pad * 2) * RES); c.height = Math.ceil((SARA.h * k + pad * 2) * RES);
      const x = c.getContext('2d', { willReadFrequently: true });
      x.filter = 'blur(2px)';        // soft edge, so the dots step up across it
      x.lineWidth = SARA.stroke; x.lineCap = x.lineJoin = 'round';
      Object.assign(pen, {
        x, res: RES, w: c.width, h: c.height, path: new Path2D(SARA.d), drawn: -1,
        cx: (width / 2 + pad) * RES, cy: (SARA.h * k / 2 + pad) * RES, k, pad
      });
    }
    // rasterise the written part of the loop (only when it has changed)
    function paintPen() {
      if (Math.abs(pen.f - pen.drawn) < .003) return;
      const x = pen.x;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, pen.w, pen.h);
      x.setTransform(pen.k * pen.res, 0, 0, pen.k * pen.res, pen.pad * pen.res, pen.pad * pen.res);
      if (pen.f > 0) { x.setLineDash([SARA_LEN * pen.f, SARA_LEN]); x.stroke(pen.path); }
      pen.map = x.getImageData(0, 0, pen.w, pen.h).data;
      pen.drawn = pen.f;
    }
    // distance from every point around the loop to the loop itself (two-pass chamfer)
    function makeField(width) {
      const RES = 1 / 3, M = WAVE_SPEED * WAVE_LIFE + 20, k = width / SARA.w;
      const W = Math.ceil((width + M * 2) * RES), H = Math.ceil((SARA.h * k + M * 2) * RES);
      const c = fieldCanvas || (fieldCanvas = document.createElement('canvas')); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.setTransform(k * RES, 0, 0, k * RES, M * RES, M * RES);
      x.lineWidth = SARA.stroke; x.lineCap = x.lineJoin = 'round';
      x.stroke(new Path2D(SARA.d));
      const a = x.getImageData(0, 0, W, H).data, d = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) d[i] = a[i * 4 + 3] > 127 ? 0 : 1e9;
      const S = Math.SQRT2;
      for (let y = 0; y < H; y++) for (let i = y * W, xx = 0; xx < W; xx++, i++) {
        if (xx > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
        if (y > 0) {
          d[i] = Math.min(d[i], d[i - W] + 1);
          if (xx > 0) d[i] = Math.min(d[i], d[i - W - 1] + S);
          if (xx < W - 1) d[i] = Math.min(d[i], d[i - W + 1] + S);
        }
      }
      for (let y = H - 1; y >= 0; y--) for (let i = y * W + W - 1, xx = W - 1; xx >= 0; xx--, i--) {
        if (xx < W - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
        if (y < H - 1) {
          d[i] = Math.min(d[i], d[i + W] + 1);
          if (xx < W - 1) d[i] = Math.min(d[i], d[i + W + 1] + S);
          if (xx > 0) d[i] = Math.min(d[i], d[i + W - 1] + S);
        }
      }
      return { W, H, d, res: RES, cx: (width / 2 + M) * RES, cy: (SARA.h * k / 2 + M) * RES };
    }
    // two rings in the loop's shape, anchored where the loop is right now
    function emit(t) {
      waves.push({ x: ptr.sx, y: ptr.sy, t }, { x: ptr.sx, y: ptr.sy, t: t + .2 });
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cell = calm ? (w < 700 ? 6 : 7) : soft ? (w < 700 ? 11 : 14) : (w < 700 ? 9 : 11);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!soft) {
        // grows with the screen, so on a big monitor it isn't lost in the field
        const size = Math.round(Math.min(900, Math.max(260, w * .36)));
        // only the width sets the loop's size, so a height-only resize keeps it
        if (size !== penSize) { penSize = size; makePen(size); field = makeField(size); }
      }
      // measured against the canvas; padded so the calm fades out rather than stops at the text
      const lede = host.querySelector('.hero-lede');
      if (lede) {
        const c = canvas.getBoundingClientRect(), l = lede.getBoundingClientRect(), PAD = 24;
        quiet = { x0: l.left - c.left - PAD, y0: l.top - c.top - PAD, x1: l.right - c.left + PAD, y1: l.bottom - c.top + PAD };
      }
      if (!running) draw(performance.now());
    }

    function updatePen(t, dt) {
      if (pen.mode === 'write') {
        if (travel > 0) { pen.f = Math.min(1, pen.f + travel / WRITE_PX); pen.still = 0; }
        else if ((pen.still += dt) > .8) pen.f = Math.max(0, pen.f - dt * .35);
        if (pen.f >= 1) { emit(t); pen.mode = 'hold'; pen.hold = t + .7; }
      } else if (pen.mode === 'hold') {
        if (t > pen.hold) pen.mode = 'erase';
      } else {
        pen.f = Math.max(0, pen.f - dt * 1.4);
        if (!pen.f) pen.mode = 'write';
      }
      travel = 0;
      paintPen();
    }

    function draw(now) {
      const t = (now - t0) / 1000, dt = Math.min(t - lastT, .05);
      lastT = t;
      ptr.sx += (ptr.x - ptr.sx) * .14;
      ptr.sy += (ptr.y - ptr.sy) * .14;
      ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * .06;
      if (!soft) updatePen(t, dt);
      for (let k = waves.length - 1; k >= 0; k--) if (t - waves[k].t > WAVE_LIFE) waves.splice(k, 1);

      ctx.clearRect(0, 0, w, h);
      const dots = new Path2D(), hot = new Path2D();
      const half = cell / 2, R = soft ? 0 : Math.max(140, w * .12), R2 = R * R;
      const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
      const penOn = !soft && pen.map && ptr.s > .01 && pen.f > 0;

      for (let j = 0; j < rows; j++) {
        const y = j * cell + half, ny = y / h;
        for (let i = 0; i < cols; i++) {
          const x = i * cell + half, nx = x / w;
          // domain-warped sines: cheap, smooth, never repeats visibly
          let v = Math.sin(nx * 3.2 + t * .32 + Math.sin(ny * 2.4 - t * .21) * 1.7)
                + Math.sin(ny * 4.1 - t * .26 + Math.cos(nx * 2.6 + t * .17) * 1.5)
                + .6 * Math.sin((nx * 1.4 - ny) * 6 + t * .55);
          v = v / 2.6 * .5 + .5;
          v = v * v * (3 - 2 * v);          // more contrast between light and dark bands
          v = v * v * (3 - 2 * v);
          v *= soft ? .6 : .75 + .35 * ny;  // hero: calmer under the headline
          if (quiet) {
            // small dots behind the intro text so it reads, growing back over ~90px around it
            const ox = Math.max(quiet.x0 - x, 0, x - quiet.x1), oy = Math.max(quiet.y0 - y, 0, y - quiet.y1);
            v *= .2 + .8 * Math.min(1, Math.hypot(ox, oy) / 90);
          }

          let p = 0;
          if (R && ptr.s > .01) {
            const dx = x - ptr.sx, dy = y - ptr.sy;
            v += ptr.s * Math.exp(-(dx * dx + dy * dy) / R2) * .3;   // a soft swell around the pointer
            if (penOn) {
              // the written part of the loop, centred on the pointer, in pink
              const bx = (dx * pen.res + pen.cx) | 0, by = (dy * pen.res + pen.cy) | 0;
              if (bx >= 0 && by >= 0 && bx < pen.w && by < pen.h) {
                p = ptr.s * pen.map[(by * pen.w + bx) * 4 + 3] / 255;
                v += p * .9;
              }
            }
          }
          for (const wv of waves) {
            const age = t - wv.t;
            if (age < 0) continue;
            const fx = ((x - wv.x) * field.res + field.cx) | 0, fy = ((y - wv.y) * field.res + field.cy) | 0;
            if (fx < 0 || fy < 0 || fx >= field.W || fy >= field.H) continue;
            const d = field.d[fy * field.W + fx] / field.res - age * WAVE_SPEED;
            const band = Math.exp(-(d * d) / 120) * (1 - age / WAVE_LIFE);   // thin bands: they read as outlines
            v += band * .75; p += band * .8;
          }

          const q = Math.floor(v * LEVELS + BAYER[(j & 3) * 4 + (i & 3)] / 16) / LEVELS;
          if (q <= 0) continue;
          const r = Math.min(q, 1) * half * .9;
          const path = p > .3 ? hot : dots;
          path.moveTo(x + r, y);
          path.arc(x, y, r, 0, 6.2832);
        }
      }
      ctx.fillStyle = calm ? 'rgba(255,255,255,.16)' : soft ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.24)';
      ctx.fill(dots);
      ctx.fillStyle = '#F95AD2';
      ctx.fill(hot);
    }

    function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
    function start() { if (running || !MOTION) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
    resize();

    if (!soft && MOTION) {
      host.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (ptr.on) travel += Math.hypot(x - ptr.x, y - ptr.y);
        else { ptr.sx = x; ptr.sy = y; }
        ptr.x = x; ptr.y = y;
        ptr.on = true;
      });
      host.addEventListener('pointerleave', () => { ptr.on = false; });
      // a click sends the loop's waves out right away
      host.addEventListener('pointerdown', () => emit((performance.now() - t0) / 1000));
    }
  }
  $$('canvas[data-halftone]').forEach(halftone);

  /* ---------- projects: hovering flips through the case-study images ----------
     Hard cuts, one image every CUT ms, starting with the next one so the
     first change is immediate; leaving puts the cover back. */
  if (HOVER) $$('.proj[data-gallery]').forEach(p => {
    const img = $('.proj-media img', p);
    const srcs = p.dataset.gallery.split(',').map(s => s.trim());
    const CUT = 650;
    let timer = 0, k = 0, loaded = false;
    p.addEventListener('mouseenter', () => {
      if (!loaded) { srcs.forEach(s => { new Image().src = s; }); loaded = true; }
      const next = () => { k = (k + 1) % srcs.length; img.src = srcs[k]; };
      next();
      timer = setInterval(next, CUT);
    });
    p.addEventListener('mouseleave', () => {
      clearInterval(timer);
      k = 0; img.src = srcs[0];
    });
  });

  /* ---------- mobile menu ----------
     On narrow screens the nav collapses into a round burger (CSS); it opens a
     full-screen menu with the same links, set large. Built here from the
     desktop nav so the pages carry no second copy of the links. */
  const navEl = $('#nav');
  if (navEl) {
    const burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'nav-burger';
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'nav-menu');
    burger.setAttribute('aria-label', document.documentElement.lang === 'sr' ? 'Meni' : 'Menu');
    burger.innerHTML = '<span></span><span></span>';
    const menu = document.createElement('div');
    menu.className = 'nav-menu';
    menu.id = 'nav-menu';
    $$('.nav-links a, .nav-right > .btn, .nav-right > .nav-lang', navEl).forEach(a => menu.append(a.cloneNode(true)));
    navEl.append(burger);
    document.body.append(menu);
    const toggle = open => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));
    menu.addEventListener('click', e => { if (e.target.closest('a')) toggle(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- buttons: a scribble under the label ----------
     No pill: the label alone, and on hover a looping line, the same loops as
     the spring and the house mark, draws itself on underneath. The loops are
     built for each button's own width, so they're never stretched. */
  function scribblePath(W, H) {
    const N = Math.max(2, Math.round(W / 34)), end = 2 * Math.PI * N + Math.PI;
    const a = W / end, R0 = a / .45;
    let d = '';
    for (let k = 0; k <= N * 32; k++) {
      const th = k / (N * 32) * end, R = R0 * (1 + .12 * Math.sin(th * .37 + 1));
      d += (k ? 'L' : 'M') + (a * th - R * Math.sin(th)).toFixed(1) + ' ' + (H / 2 + R * .75 * Math.cos(th)).toFixed(1);
    }
    return d;
  }
  const scribbles = $$('.btn').map(b => {
    b.insertAdjacentHTML('beforeend', '<svg class="btn-scribble" aria-hidden="true"><path pathLength="1" /></svg>');
    return $('.btn-scribble', b);
  });
  const drawScribbles = () => scribbles.forEach(svg => $('path', svg).setAttribute('d', scribblePath(svg.clientWidth, svg.clientHeight)));
  drawScribbles();
  addEventListener('resize', drawScribbles);
  // the label's font arrives late and changes the width
  if (document.fonts) document.fonts.ready.then(drawScribbles);

  /* ---------- inquiry form ----------
     Posted to Formspree in the background so the visitor stays on the page.
     The texts come from the form's data-* attributes, so each language sets
     its own. If fetch fails for any reason the form is submitted normally,
     so a message is never silently lost. */
  const inquiry = $('#project-inquiry');
  if (inquiry) {
    const services = $$('input[name="services"]', inquiry);
    const status = $('#form-status');
    const button = $('button[type="submit"]', inquiry);
    // at least one service, while keeping the checkboxes multi-select
    const checkServices = () => services[0].setCustomValidity(services.some(s => s.checked) ? '' : inquiry.dataset.needService);
    services.forEach(s => s.addEventListener('change', checkServices));
    inquiry.addEventListener('submit', async e => {
      checkServices();
      e.preventDefault();
      if (!inquiry.checkValidity()) { inquiry.reportValidity(); return; }
      button.disabled = true;
      status.hidden = false;
      status.className = 'form-status';
      status.textContent = inquiry.dataset.sending;
      try {
        const res = await fetch(inquiry.action, { method: 'POST', body: new FormData(inquiry), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('rejected');
        inquiry.reset();
        status.className = 'form-status is-ok';
        status.textContent = inquiry.dataset.ok;
      } catch {
        status.hidden = true;
        inquiry.submit();   // last resort: hand it to the browser
        return;
      }
      button.disabled = false;
    });
  }

  /* ---------- FAQ: smooth open/close on <details> ---------- */
  $$('.faq-item').forEach(item => {
    const sum = $('summary', item), body = $('.faq-a', item);
    sum.addEventListener('click', e => {
      if (!HAS_GSAP || !MOTION) return;
      e.preventDefault();
      if (!item.open) {
        item.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .6, ease: 'expo.out' });
      } else {
        gsap.to(body, { height: 0, opacity: 0, duration: .45, ease: 'expo.inOut',
          onComplete: () => { item.open = false; gsap.set(body, { clearProps: 'all' }); } });
      }
    });
  });

  if (!HAS_GSAP) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- text splitting ---------- */
  // every word gets a clipping mask, every letter rises inside it
  function splitChars(el) {
    (function walk(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const mask = document.createElement('span'); mask.className = 'split-line';
            const word = document.createElement('span'); word.className = 'split-word';
            for (const ch of part) {
              const c = document.createElement('span'); c.className = /[.,!?]/.test(ch) ? 'split-char is-punct' : 'split-char'; c.textContent = ch;
              word.append(c);
            }
            mask.append(word); frag.append(mask);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName.toLowerCase() !== 'svg') walk(n);
      });
    })(el);
    el.classList.add('is-split');
    return $$('.split-char', el);
  }
  // words only, for the scroll-lit statement
  function splitWords(el) {
    (function walk(node) {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const s = document.createElement('span'); s.className = 'sw'; s.textContent = part;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'svg') walk(n);
      });
    })(el);
    return $$('.sw', el);
  }
  const drawPath = path => { const L = path.getTotalLength(); gsap.set(path, { strokeDasharray: L, strokeDashoffset: L }); return L; };

  /* ---------- the spring ----------
     Drawn in the spirit of the house mark's loop: round, even loops at the
     same stroke weight, never stretched. It's a prolate cycloid (x = aθ − R·sinθ,
     y = −R·cosθ) with the loop size wavering a little so it reads hand-drawn.
     The path is built for the svg's width; set(p) draws the first p of it on
     like a pen and returns where the pen is, in px from the left. Used above
     the steps on the home page (#spring) and as .spring-draw elsewhere. */
  function makeSpring(svg, opts = {}) {
    const path = $('path', svg);
    let len = 0;
    const build = () => {
      const W = opts.width ? opts.width() : svg.clientWidth, cy = svg.clientHeight / 2;
      const N = Math.max(2, Math.round(W / 150));                 // one loop per ~150px
      // finish on a downstroke, moving right; or, closed, at the bottom of a full last loop,
      // the mirror image of how the line starts
      const end = 2 * Math.PI * N + (opts.closed ? 0 : Math.PI);
      const a = W / end, R0 = a / .45;                             // wide loop sweep…
      const STEPS = N * 48;
      let d = '';
      for (let k = 0; k <= STEPS; k++) {
        const th = k / STEPS * end, R = R0 * (1 + .12 * Math.sin(th * .37 + 1));
        // …at three quarters the height, so the loops come out round rather than tall;
        // loops hang below the line, the way the house mark's loop is drawn
        d += (k ? 'L' : 'M') + (a * th - R * Math.sin(th)).toFixed(1) + ' ' + (cy + R * .75 * Math.cos(th)).toFixed(1);
      }
      path.setAttribute('d', d);
      len = path.getTotalLength();
      path.style.strokeDasharray = len;
    };
    const set = p => {
      path.style.strokeDashoffset = len * (1 - p);
      return p > 0 ? path.getPointAtLength(len * p).x : 0;
    };
    build();
    return { svg, build, set };
  }
  // the home page spring stops at 04 and curls up over it the way it began, as an ending
  const lastN = $('.step-launch .step-n > span');
  const spring = $('#spring') && makeSpring($('#spring'), {
    closed: true, width: lastN ? () => lastN.closest('.step').offsetLeft + lastN.offsetWidth : null });
  const looseSprings = $$('.spring-draw').map(makeSpring);

  // On a slow first visit the CDN scripts can arrive after the 3.5s safety
  // net has already shown everything; hiding it again to animate it in made
  // sections vanish. In that case the page just stays as it is, static.
  const LATE = document.documentElement.classList.contains('motion-failsafe');
  window.hsMotionReady = true;

  if (!MOTION || LATE) {
    // without motion the lines are simply there, drawn
    [spring, ...looseSprings].forEach(s => s && s.set(1));
    document.documentElement.classList.add('motion-failsafe');
    return;
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -40, duration: 1.4 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));


  // titles: whole words fade in while they slide gently up into place
  const SOFT_FROM = { opacity: 0, y: 28 };
  const SOFT_TO = { opacity: 1, y: 0, duration: 1, ease: 'power3.out' };
  const wordsOf = el => $$('.split-word', el);

  /* ---------- hero intro ----------
     On the home page the words fade up into place; a title marked data-plain
     (the about page) simply fades in, nothing moving. The case study has no
     hero at all, so this whole part is skipped there. */
  const heroTitle = $('.hero-title');
  if (heroTitle) {
  const plain = heroTitle.hasAttribute('data-plain');
  const heroChars = plain ? [] : splitChars(heroTitle);
  const heroFades = $$('.hero [data-fade]');
  if (!plain) heroTitle.classList.add('split-soft');
  const heroWords = plain ? [] : wordsOf(heroTitle);
  gsap.set(heroWords, SOFT_FROM);
  gsap.set(heroFades, { y: 24, opacity: 0 });
  heroFades.forEach(el => el.classList.add('is-ready'));
  if (plain) { gsap.set(heroTitle, { opacity: 0 }); heroTitle.classList.add('is-ready'); }

  gsap.timeline({ delay: .15 })
    .to(plain ? heroTitle : heroWords, plain
      ? { opacity: 1, duration: 1, ease: 'power2.out' }
      : { ...SOFT_TO, stagger: .09 })
    .to(heroFades, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', stagger: .1 }, '-=.75');

  // leaving the hero: the headline drifts up and fades
  gsap.to('.hero-inner', { yPercent: -30, opacity: .2, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- generic reveals ---------- */
  // "Recent work" keeps the letters rising out of a mask; every other title
  // fades up word by word like the hero
  $$('[data-split]').forEach(el => {
    if (el.closest('.hero')) return;
    const chars = splitChars(el);
    const rise = !!el.closest('.work-title');
    if (!rise) el.classList.add('split-soft');
    const words = wordsOf(el);
    if (rise) gsap.set(chars, { yPercent: 115 }); else gsap.set(words, SOFT_FROM);
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => rise
        ? gsap.to(chars, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .025 })
        : gsap.to(words, { ...SOFT_TO, stagger: .09 })
    });
  });
  $$('[data-fade]').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.set(el, { y: 36, opacity: 0 });
    el.classList.add('is-ready');
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1, ease: 'expo.out' })
    });
  });

  /* ---------- statement: words light up with the scroll ---------- */
  const stmt = $('#statement');
  if (stmt) {
  const words = splitWords(stmt);
  gsap.fromTo(words, { opacity: .14 }, {
    opacity: 1, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: stmt, start: 'top 78%', end: 'bottom 45%', scrub: .6 }
  });
  }

  /* ---------- work ---------- */
  if ($('.work-title')) {
  gsap.fromTo('.wt-line:not(.wt-pink)', { xPercent: -12 }, { xPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.work-title', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.wt-pink', { xPercent: 18 }, { xPercent: -4, ease: 'none',
    scrollTrigger: { trigger: '.work-title', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  $$('.proj').forEach(p => {
    const media = $('.proj-media', p), img = $('img', media);
    gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 30%', scrub: .8 } })
      .fromTo(media, { clipPath: 'inset(22% 14% 22% 14% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none' }, 0)
      .fromTo(img, { scale: 1.4 }, { scale: 1.12, ease: 'none' }, 0);   // stays a bit over size so the parallax never shows an edge
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // (the pointer circle / holographic lens lives in its own block at the end of the file)

  /* ---------- services ---------- */
  if ($('#svc-list')) gsap.from('.svc-row', {
    y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1,
    scrollTrigger: { trigger: '#svc-list', start: 'top 85%', once: true }
  });

  /* ---------- process: the spring draws itself across the steps ----------
     Numbers rise out of their masks as the steps come into view. On wide
     screens the section then holds briefly while scrolling draws the spring
     from 01 to 04 Launch, and lets go as soon as the last loop closes over 04, so it
     never sits stuck there. On phones (no spring) it simply runs in one go.
     Each number the pen reaches turns blue, Launch pink. */
  if ($('#process')) {
  const steps = $$('.step');
  gsap.set($$('.step-n > span'), { yPercent: 105 });
  gsap.set(steps.flatMap(s => [$('h3', s), $('p', s)]), { y: 24, opacity: 0 });

  const sp = { p: 0 };
  const renderSpring = () => {
    const end = spring.set(sp.p);
    const oneRow = innerWidth > 800;   // on phones the steps stack, so go by progress
    steps.forEach((s, i) => s.classList.toggle('is-on',
      i === 3 ? sp.p > .98 : oneRow ? end >= s.offsetLeft + 24 : sp.p >= i * .3 + .02));
  };
  ScrollTrigger.create({
    trigger: '#steps', start: 'top 82%', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      steps.forEach((s, i) => {
        tl.to($('.step-n > span', s), { yPercent: 0, duration: 1.1, ease: 'expo.out' }, i * .12)
          .to([$('h3', s), $('p', s)], { y: 0, opacity: 1, duration: .9, ease: 'expo.out', stagger: .07 }, i * .12 + .15);
      });
      if (innerWidth <= 800) tl.to(sp, { p: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: renderSpring }, .3);
    }
  });
  if (innerWidth > 800) {
    const proc = $('#process');
    gsap.timeline({
      scrollTrigger: {
        trigger: proc, pin: true, scrub: 1, anticipatePin: 1,
        start: () => proc.offsetHeight > innerHeight ? 'top top' : 'center center',
        end: '+=60%', invalidateOnRefresh: true
      }
    }).to(sp, { p: 1, duration: 1, ease: 'power1.inOut', onUpdate: renderSpring })
      .to({}, { duration: .08 });   // a breath at 04, not a stall
  }
  renderSpring();
  addEventListener('resize', () => { spring.build(); spring.set(sp.p); });
  }

  // loose springs draw themselves on as their section scrolls through
  looseSprings.forEach(s => {
    ScrollTrigger.create({
      trigger: s.svg, start: 'top 85%', end: 'bottom 35%', scrub: .6,
      onUpdate: self => s.set(self.progress)
    });
    s.set(0);
    addEventListener('resize', () => s.build());
  });

  /* ---------- studio photo: tilts in with the scroll ---------- */
  if ($('#studio-visual')) gsap.fromTo('#studio-visual', { rotation: 12, y: 80 }, { rotation: -3, y: -40, ease: 'none',
    scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true } });


  // images and fonts arrive late and change heights; re-measure once they're in.
  // 'load' doesn't wait for lazy images, so each one re-measures as it lands,
  // otherwise reveals further down fire in the wrong place or never.
  let refreshT = 0;
  const refreshSoon = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 150); };
  addEventListener('load', refreshSoon);
  if (document.fonts) document.fonts.ready.then(refreshSoon);
  $$('img').forEach(img => { if (!img.complete) img.addEventListener('load', refreshSoon, { once: true }); });
  // back/forward cache: the page comes back as it was left, measure it again
  addEventListener('pageshow', e => { if (e.persisted) refreshSoon(); });
})();
/* ---------------------------------------------------------------
   CURSOR (as on alexlazarev.space)
   A small circle trails the pointer (lerp .2) and inverts what's under it.
   Over links it grows; over images it grows and turns pink.
   --------------------------------------------------------------- */
(() => {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cur = document.createElement('div');
  cur.className = 'hs-cursor';
  cur.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cur);

  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  const loop = () => {
    cx += (x - cx) * .2; cy += (y - cy) * .2;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  const LINK = 'a, button, label, summary, [role="button"]';
  const MEDIA = '.proj-media, img, video, [data-cursor="holo"]';
  document.addEventListener('mouseover', e => {
    const t = e.target;
    const m = t.closest(MEDIA);
    const media = !!m && m.offsetWidth > 120 && m.offsetHeight > 120;   // not logos/icons
    cur.classList.toggle('pink', media);
    cur.classList.toggle('big', media || !!t.closest(LINK));
  });
})();
