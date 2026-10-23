// ---------- generative field ----------
// A slowly flowing noise field, drawn as ordered-dither pixels in the brand
// palette (ink → blue → lilac → white). It is rendered at one pixel per cell
// and scaled up by CSS with image-rendering: pixelated, so the per-frame work
// stays small. The pointer pushes a soft bulge into the field. It only animates
// while on screen, and draws a single still frame for reduced motion.

(() => {
  const PALETTE = ['#0B0B0F', '#3B43FE', '#BEA4F5', '#FFFFFF'];
  const CELL = 8;         // CSS px per dither pixel
  const FPS = 20;         // it drifts slowly; more frames only cost CPU

  // 4×4 Bayer matrix, as thresholds in 0..1
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);

  // colours packed for a Uint32 view of ImageData (little-endian: ABGR)
  const packed = PALETTE.map(hex => {
    const n = parseInt(hex.slice(1), 16);
    return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16);
  });

  // value noise: hashed lattice, smoothstep blend
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => .55 * noise(x, y) + .3 * noise(x * 2.1, y * 2.1) + .15 * noise(x * 4.3, y * 4.3);
  // the cheap version for the per-frame field: two octaves
  const fbm2 = (x, y) => .65 * noise(x, y) + .35 * noise(x * 2.1, y * 2.1);

  // ---- the opening story (data-story): pixel sprites, palette letters ----
  // k ink · b blue · l lilac · w white · . empty
  const ALIEN = [
    ['..l..l..', '...ll...', '.llllll.', 'llkllkll', 'llllllll', '.llllll.', '..llll..', '.llllll.', 'l.llll.l', '..l..l..'],
    ['..l..l..', '...ll...', '.llllll.', 'llkllkll', 'llllllll', '.llllll.', '..llll..', '.llllll.', 'l.llll.l', '.l....l.']
  ];
  const UFO = ['.....wwwwww.....', '....wbbbbbbw....', '..llllllllllll..', '.bbbbbbbbbbbbbb.', 'bbwbbwbbwbbwbbwb', '.bbbbbbbbbbbbbb.', '...llll..llll...'];
  const CODE = { k: 0, b: 1, l: 2, w: 3 };
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const STORY_END = 7.2;    // seconds; the field has fully washed in by then
  // draws one frame of the story into buf over the field already there
  function story(buf, cols, rows, s) {
    // the ground line, and a sprite scale that keeps the whole scene (UFO
    // hovering over the alien) between it and the top of the band
    const ground = Math.round(rows * .72);
    const S = Math.max(1, Math.floor(ground / 28));        // cells per sprite pixel
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < cols && y < rows) buf[y * cols + x] = packed[c]; };
    const sprite = (rowsArr, ox, oy) => rowsArr.forEach((line, j) => [...line].forEach((ch, i) => {
      if (ch === '.') return;
      for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) put(Math.round(ox) + i * S + b, Math.round(oy) + j * S + a, CODE[ch]);
    }));
    // the field spreads out from where the UFO left (top right), as a wave
    // with a ragged pixel front, until it covers the whole band
    const reveal = clamp01((s - 5.1) / 1.9);
    const front = ease(reveal) * 1.5;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((cols - x) / cols, (y / rows) * .7);
      const jag = (hash(x >> 2, y >> 2) - .5) * .16 + (hash(x, y) - .5) * .05;
      if (d + jag < front) continue;                         // field shows here
      const i = y * cols + x;
      // stars, twinkling; a dithered lilac ground under the walk
      let c = 0;
      if (y < ground && hash(x * 3, y * 5) > .996 && Math.sin(s * 3 + x) > -.3) c = 3;
      if (y >= ground && y < ground + S && BAYER[(y & 3) * 4 + (x & 3)] < .5) c = 2;
      buf[i] = packed[c];
    }
    if (reveal >= 1) return;
    const ax = cols * .5 - 4 * S, ay = ground - 10 * S;
    const ux = cols * .5 - 8 * S;
    // UFO: comes down 1.4–3.0, hovers, flies off up and right 4.6–5.8
    let uy = -8 * S + (ay - 13 * S + 8 * S) * ease(clamp01((s - 1.4) / 1.6));
    let uxx = ux;
    const fly = clamp01((s - 4.6) / 1.2);
    uxx += fly * fly * cols * .8;
    uy -= fly * fly * rows * .9;
    uy += Math.sin(s * 3) * S * .5;
    // beam 3.0–4.6, a dithered lilac cone under the UFO
    const beam = s > 3 && s < 4.6 ? Math.min(1, (s - 3) / .3, (4.6 - s) / .2) : 0;
    if (beam > 0) {
      const top = Math.round(uy + 7 * S), bottom = ground;
      for (let y = top; y < bottom; y++) {
        const k = (y - top) / Math.max(1, bottom - top);
        const half = (3 + k * 5) * S * beam;
        for (let x = Math.round(cols * .5 - half); x < cols * .5 + half; x++) {
          if (BAYER[(y & 3) * 4 + (x & 3)] < .45 * beam) put(x, y, 2);
        }
      }
    }
    // alien: walks in 0.2–3.0, rises 3.4–4.4 (into the UFO, drawn on top)
    const walk = clamp01((s - .2) / 2.8);
    const rise = ease(clamp01((s - 3.4) / 1));
    if (s < 4.45) {
      const x = -8 * S + (ax + 8 * S) * ease(walk);
      const y = ay - rise * (ay - (uy + 2 * S));
      const frame = walk > 0 && walk < 1 ? ((s * 6) | 0) % 2 : 0;
      sprite(ALIEN[frame], x, y + (walk < 1 && frame ? -1 : 0));
    }
    if (uy > -8 * S && uxx < cols) sprite(UFO, uxx, uy);
  }

  function field(canvas) {
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cols = 0, rows = 0, img = null, buf = null;
    let visible = false, raf = null, last = 0;
    // the pointer, in cells, eased toward its target
    const ptr = { x: -999, y: -999, tx: -999, ty: -999, s: 0, ts: 0 };

    function resize() {
      const r = canvas.getBoundingClientRect();
      // never more than ~180 cells across, so a big screen costs no more than a laptop
      const cell = Math.max(CELL, r.width / 180);
      cols = Math.max(1, Math.ceil(r.width / cell));
      rows = Math.max(1, Math.ceil(r.height / cell));
      canvas.width = cols;
      canvas.height = rows;
      img = ctx.createImageData(cols, rows);
      buf = new Uint32Array(img.data.buffer);
    }

    // data-story: plays the alien story once, the first time it is on screen
    const STORY = canvas.hasAttribute('data-story') && !still;
    let storyStart = null;

    // data-edge: one edge of the field breaks up into blocks that fall away;
    // the bottom by default, data-edge="top" for the top
    const EDGE = canvas.hasAttribute('data-edge');
    const TOP = canvas.getAttribute('data-edge') === 'top';
    // data-seed: shifts the noise so several fields on a page never match
    const SEED = parseFloat(canvas.dataset.seed || 0);
    const BLOCK = 4;   // cells per edge block

    function draw(t) {
      const time = t / 1000 + SEED;
      ptr.x += (ptr.tx - ptr.x) * .12;
      ptr.y += (ptr.ty - ptr.y) * .12;
      ptr.s += (ptr.ts - ptr.s) * .08;
      const sc = 3.2 / Math.max(cols, rows) * 2.2;   // noise scale: same look at any size
      const rad = Math.max(cols, rows) * .14;
      const n = PALETTE.length - 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // warped, drifting bands
          const wx = x * sc, wy = y * sc * 1.4;
          const warp = noise(wx * .7 + time * .05, wy * .7 - time * .04);
          let v = fbm2(wx + warp * 1.6 + time * .07, wy - warp * 1.2 + time * .03);
          v = v * .9 + .5 * (Math.sin((x * sc + warp * 2.5 + time * .25) * 2.2) * .5 + .5) * .2;
          // the pointer lifts the field toward the light end of the palette
          const dx = x - ptr.x, dy = y - ptr.y;
          v += .5 * ptr.s * Math.exp(-(dx * dx + dy * dy) / (rad * rad));
          v = Math.min(1, Math.max(0, (v - .18) / .7));
          const p = v * n, i = Math.floor(p);
          const pick = (p - i) > BAYER[(y & 3) * 4 + (x & 3)] ? Math.min(n, i + 1) : i;
          let out = packed[pick];
          if (EDGE) {
            const band = rows * (TOP ? .4 : .22), from = rows - band;
            // distance into the band, 0 at its inner side, 1 at the very edge
            const k = TOP ? 1 - y / band : (y - from) / band;
            if (k > 0) {
              // the deeper into the band, the fewer blocks survive; the blocks
              // shift slowly so the edge flickers like a signal
              const bx = (x / BLOCK) | 0, by = (y / BLOCK) | 0;
              const keep = hash(bx * 7 + ((time * .8) | 0), by * 13) > k * 1.05;
              if (!keep) out = 0;
            }
          }
          buf[y * cols + x] = out;
        }
      }
      if (STORY) {
        if (storyStart === null) storyStart = t;
        const s = (t - storyStart) / 1000;
        if (s < STORY_END) story(buf, cols, rows, s);
      }
      ctx.putImageData(img, 0, 0);
    }

    function loop(t) {
      raf = null;
      if (!visible || document.hidden) return;
      if (t - last >= 1000 / FPS) { last = t; draw(t); }
      raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!still && raf === null) raf = requestAnimationFrame(loop); };

    resize();
    if (!STORY) draw(performance.now());
    new ResizeObserver(() => { resize(); if (!STORY || storyStart !== null) draw(performance.now()); }).observe(canvas);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);

    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.tx = (e.clientX - r.left) / r.width * cols;
      ptr.ty = (e.clientY - r.top) / r.height * rows;
      if (ptr.x < -900) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
      ptr.ts = 1;
    });
    host.addEventListener('pointerleave', () => { ptr.ts = 0; });
  }

  document.querySelectorAll('canvas.gen-field').forEach(field);
})();

// ---------- pixel edge ----------
// A band of square ink blocks on white: solid at the bottom, thinning out
// toward the top, so a black section breaks up into the white one above it.
// A few blocks flip every so often, so the edge stays alive.
(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('canvas.px-edge').forEach(cv => {
    const ctx = cv.getContext('2d');
    let cols = 0, rows = 0, on = null, chance = null, timer = null;
    const INK = '#0B0B0F';
    const build = () => {
      const r = cv.getBoundingClientRect();
      const size = Math.max(14, Math.round(r.width / 110));   // block size
      cols = Math.ceil(r.width / size); rows = Math.ceil(r.height / size);
      cv.width = cols; cv.height = rows;
      on = new Uint8Array(cols * rows); chance = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        // depth: 0 at the top, 1 at the bottom; eased so the top stays sparse
        const d = (y + .5) / rows, p = Math.pow(d, 1.6);
        chance[y * cols + x] = p;
        on[y * cols + x] = Math.random() < p ? 1 : 0;
      }
      paint();
    };
    const paint = () => {
      ctx.clearRect(0, 0, cols, rows);
      ctx.fillStyle = INK;
      for (let i = 0; i < on.length; i++) if (on[i]) ctx.fillRect(i % cols, (i / cols) | 0, 1, 1);
      // the last row is always solid, so it joins the black below cleanly
      ctx.fillRect(0, rows - 1, cols, 1);
    };
    const flicker = () => {
      for (let k = 0; k < Math.max(3, cols / 12); k++) {
        const i = (Math.random() * on.length) | 0;
        on[i] = Math.random() < chance[i] ? 1 : 0;
      }
      paint();
    };
    build();
    new ResizeObserver(build).observe(cv);
    if (still) return;
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(flicker, 140);
    }).observe(cv);
  });
})();

// ---------- service pieces ----------
// One small generative piece per service, in the hero's pixel palette:
//   brand  – a mark that keeps reshaping (circle → square → diamond → star)
//   social – a feed of posts drifting up, lighting one after another
//   web    – a browser window that builds a page block by block, then a
//            pixel cursor goes to its button and clicks
// Drawn at one pixel per cell and scaled up; they animate only on screen.
(() => {
  const C = { k: '#0B0B0F', b: '#3B43FE', l: '#BEA4F5', w: '#FFFFFF', g: '#1B1C3A' };
  const CELL = 7, FPS = 15;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  const dith = (x, y, v) => v > BAYER[(y & 3) * 4 + (x & 3)];
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = t => t * t * (3 - 2 * t);

  const ART = {
    // a mark that keeps reshaping: circle → square → diamond → star
    brand(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .34;
      const p = (t / 2.4) % 4, i = Math.floor(p), f = smooth(clamp01((p - i - .55) / .45));
      const rot = t * .35;
      const shape = (n, x, y) => {
        const a = Math.atan2(y, x) + rot, r = Math.hypot(x, y);
        const ux = r * Math.cos(a), uy = r * Math.sin(a);
        if (n === 0) return r - R;
        if (n === 1) return Math.max(Math.abs(ux), Math.abs(uy)) - R * .86;
        if (n === 2) return (Math.abs(ux) + Math.abs(uy)) * .72 - R * .86;
        return r - R * (.62 + .38 * Math.cos(4 * a));
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const d = shape(i, dx, dy) * (1 - f) + shape((i + 1) % 4, dx, dy) * f;
        let col = null;
        if (d < -R * .45) col = dith(x, y, .5) ? C.b : C.l;              // core
        else if (d < 0) col = C.l;                                        // body
        else if (d < 1.5) col = C.k;                                      // outline
        if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
      }
    },
    // a signal: rings of pixels spreading out from one point, like a post
    // travelling outward
    social(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, max = Math.min(W, H) * .48;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > max) continue;
        // three rings, each expanding and fading as it goes
        let col = null;
        for (let k = 0; k < 3; k++) {
          const r = ((t * .5 + k / 3) % 1) * max;
          const fade = 1 - r / max;
          if (Math.abs(d - r) < 1.6 && dith(x, y, .35 + fade * .65)) col = k === 1 ? C.l : C.b;
        }
        if (d < max * .1) col = C.k;                                      // the source
        else if (d < max * .16) col = C.b;
        if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
      }
    },
    // responsive: a frame that keeps flowing from a wide desktop to a tall
    // phone and back, its layout blocks reflowing inside as it goes
    web(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const m = (Math.sin(t * .7) + 1) / 2;                 // 0 desktop … 1 phone
      const area = Math.min(W, H) * Math.min(W, H) * .62;
      const ar = 1.55 - m * 1.0;                            // width / height
      const fw = Math.min(W * .86, Math.sqrt(area * ar)), fh = Math.min(H * .86, fw / ar);
      const x0 = (W - fw) / 2, y0 = (H - fh) / 2;
      // inner layout: one split that turns from vertical to horizontal
      const pad = 3, band = Math.max(2, fh * .12);
      const ix = x0 + pad, iy = y0 + pad + band + 1, iw = fw - 2 * pad, ih = fh - 2 * pad - band - 1;
      const splitV = .58 + .08 * Math.sin(t * 1.3);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = x + .5, v = y + .5;
        if (u < x0 || u > x0 + fw || v < y0 || v > y0 + fh) continue;
        let col = C.l;
        const edge = u - x0 < 1.5 || x0 + fw - u < 1.5 || v - y0 < 1.5 || y0 + fh - v < 1.5;
        if (edge) col = C.k;
        else if (v < y0 + pad + band) col = (u > x0 + fw - pad - fw * .2 && v > y0 + pad) ? C.b : C.w;   // top bar
        else if (u > ix && u < ix + iw && v > iy && v < iy + ih) {
          const lu = (u - ix) / iw, lv = (v - iy) / ih;
          // desktop: big block left, column right · phone: big block top, rows under
          const inBig = lv < (1 - m) * 1 + m * splitV && lu < (1 - m) * splitV + m * 1;
          if (inBig) col = dith(x, y, .5) ? C.b : C.l;
          else {
            // small modules, three of them in a column or a row
            const q = (1 - m) * lv + m * lu;
            const cell = Math.floor(q * 3), off = (q * 3) % 1;
            col = off < .14 ? C.l : (cell === 1 ? C.b : C.w);
          }
        }
        ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
      }
    },
    // product: a phone screen whose content keeps scrolling, with a toggle
    // at the bottom that slides on and off
    product(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const ph = H * .8, pw = ph * .6, x0 = (W - pw) / 2, y0 = (H - ph) / 2, r = pw * .16;
      const inside = (u, v) => {
        const dx = Math.max(x0 + r - u, 0, u - (x0 + pw - r)), dy = Math.max(y0 + r - v, 0, v - (y0 + ph - r));
        return Math.hypot(dx, dy) - r;
      };
      const scroll = t * 5;
      const toggle = (Math.sin(t * 1.6) + 1) / 2;
      const tx = x0 + pw * .18, ty = y0 + ph * .85, tw = pw * .64, th = Math.max(5, ph * .12);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = x + .5, v = y + .5;
        const d = inside(u, v);
        if (d > 0) continue;
        let col;
        if (d > -1.5) col = C.k;                                            // outline
        else if (v > ty - th * .5 - 2) {
          // the toggle: a pill track and a knob that slides
          const cy = ty, kx = tx + th / 2 + toggle * (tw - th);
          const track = Math.hypot(Math.max(tx + th / 2 - u, 0, u - (tx + tw - th / 2)), v - cy) < th / 2;
          const knob = Math.hypot(u - kx, v - cy) < th / 2 - 1;
          col = knob ? C.w : track ? (u < kx ? C.b : C.k) : C.l;
        } else {
          // scrolling cards: alternating rows, each with a darker title line
          const rowH = ph * .17, local = (v - y0 + scroll) % rowH, row = Math.floor((v - y0 + scroll) / rowH);
          if (local < 2) col = C.l;
          else if (local < 5 && u > x0 + pw * .15 && u < x0 + pw * (.5 + .3 * ((row * 7) % 3) / 2)) col = C.k;
          else col = row % 2 ? (dith(x, y, .5) ? C.b : C.l) : C.l;
          if (v < y0 + ph * .08) col = C.l;                                  // status bar
        }
        ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  document.querySelectorAll('canvas.svc-art').forEach(cv => {
    const draw = ART[cv.dataset.art];
    if (!draw) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, visible = false, raf = null, last = 0;
    const t0 = performance.now();
    const size = () => {
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.max(1, Math.ceil(r.width / CELL));
      H = cv.height = Math.max(1, Math.ceil(r.height / CELL));
      draw(ctx, W, H, still ? 1.3 : (performance.now() - t0) / 1000);
    };
    const loop = (t) => {
      raf = null;
      if (!visible || document.hidden) return;
      if (t - last >= 1000 / FPS) { last = t; draw(ctx, W, H, (t - t0) / 1000); }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (visible && raf === null) raf = requestAnimationFrame(loop); };
    size();
    new ResizeObserver(size).observe(cv);
    if (still) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(cv);
    document.addEventListener('visibilitychange', start);
  });
})();
