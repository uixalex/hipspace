// ---------- performance profile ----------
// Every canvas here is redrawn by the CPU, so weaker machines (few cores, little
// memory, phones) get fewer frames; the look stays the same. Shared by all
// the pieces below.
const GEN_LITE = (navigator.hardwareConcurrency || 4) <= 4
  || (navigator.deviceMemory || 8) <= 4
  || window.matchMedia('(max-width: 900px), (hover: none)').matches;
const GEN_DPR = Math.min(1.5, window.devicePixelRatio || 1);

// ---------- generative field ----------
// A slowly flowing noise field, drawn as a soft mesh gradient (ink → blue →
// violet → pink → coral) with halftone dots drifting over it. The mesh is
// computed at one value per cell and drawn up smoothly, so the per-frame work
// stays small. The pointer warms the mesh and opens up the dots under it. It
// only animates while on screen, and draws a single still frame for reduced motion.

(() => {
  const PALETTE = ['#0B0B0F', '#3B43FE', '#F28AD9', '#FFFFFF'];
  const CELL = 10;        // CSS px per cell (one mesh value, one dot)
  const FPS = GEN_LITE ? 12 : 20;   // it drifts slowly; more frames only cost CPU

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

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // ---- the opening (data-story): a signal ----
  // A dark screen and one pulsing dot in the middle, the transmitter. Then a
  // wave of dots goes out from it like sound or radio, and the mesh comes alive
  // behind the wave front, with two fainter echoes following it.
  const SIGNAL_START = .8, SIGNAL_RUN = 2.6;
  const SIGNAL_END = SIGNAL_START + SIGNAL_RUN + .8;   // seconds; fully open by then

  // the mesh: a smooth gradient map from ink through blue and violet into pink
  // and coral, so the field reads as a soft mesh gradient, not a palette
  const STOPS = [
    [0, '#0B0B0F'], [.26, '#151C9C'], [.44, '#3B43FE'], [.6, '#8C6BFF'],
    [.74, '#E68BE6'], [.87, '#FF6A3D'], [1, '#FFE1EE']
  ].map(([p, hex]) => [p, parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  const gmap = (v) => {
    let i = 1;
    while (i < STOPS.length - 1 && v > STOPS[i][0]) i++;
    const a = STOPS[i - 1], b = STOPS[i], f = Math.min(1, Math.max(0, (v - a[0]) / (b[0] - a[0])));
    return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
  };
  // the same colours as css strings, in 24 steps, for the halftone dots
  const DOT = Array.from({ length: 24 }, (_, k) => { const [r, g, b] = gmap(k / 23); return `rgb(${r | 0},${g | 0},${b | 0})`; });

  function field(canvas) {
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the mesh is computed at one value per cell into a small canvas, then
    // drawn up smoothly; the dots are drawn on top at full resolution
    const mesh = document.createElement('canvas'), mctx = mesh.getContext('2d');
    let cols = 0, rows = 0, img = null, buf = null, W = 0, H = 0, cell = CELL;
    let visible = false, raf = null, last = 0;
    // the pointer, in cells, eased toward its target
    const ptr = { x: -999, y: -999, tx: -999, ty: -999, s: 0, ts: 0 };

    function resize() {
      const r = canvas.getBoundingClientRect(), dpr = GEN_DPR;
      // never more than ~170 cells across, so a big screen costs no more than a laptop;
      // data-cell gives a small field finer dots
      const c = Math.max(parseFloat(canvas.dataset.cell) || CELL, r.width / 140);
      cols = Math.max(1, Math.ceil(r.width / c));
      rows = Math.max(1, Math.ceil(r.height / c));
      W = canvas.width = Math.max(1, Math.round(r.width * dpr));
      H = canvas.height = Math.max(1, Math.round(r.height * dpr));
      cell = W / cols;
      mesh.width = cols; mesh.height = rows;
      img = mctx.createImageData(cols, rows);
      buf = new Uint32Array(img.data.buffer);
    }

    // data-story: plays the signal opening once, the first time it is on screen
    const STORY = canvas.hasAttribute('data-story') && !still;
    let storyStart = null;
    // a click or tap anywhere on the field sends out a new signal from there
    const pulses = [];
    // data-edge: one edge of the field breaks up into halftone dots that shrink
    // away; the bottom by default, data-edge="top" for the top
    const EDGE = canvas.hasAttribute('data-edge');
    const TOP = canvas.getAttribute('data-edge') === 'top';
    // data-seed: shifts the noise so several fields on a page never match
    const SEED = parseFloat(canvas.dataset.seed || 0);
    // data-shape="planet": the field cut to a disc with a tilted ring round it
    const PLANET = canvas.dataset.shape === 'planet';

    function draw(t) {
      const time = t / 1000 + SEED;
      ptr.x += (ptr.tx - ptr.x) * .12;
      ptr.y += (ptr.ty - ptr.y) * .12;
      ptr.s += (ptr.ts - ptr.s) * .08;
      const sc = 3.2 / Math.max(cols, rows) * 2.2;   // noise scale: same look at any size
      const rad = Math.max(cols, rows) * .14;
      // the opening: how far the first wave has travelled, in cells from the middle
      let open = Infinity, s = 0;
      const ocx = cols / 2, ocy = rows / 2, far = Math.hypot(ocx, ocy) + 6;
      if (STORY) {
        // wait in the dark until the home opening (html.intro) has finished, so
        // the signal goes out where it can be seen
        if (storyStart === null && !document.documentElement.classList.contains('intro')) storyStart = t;
        s = storyStart === null ? 0 : (t - storyStart) / 1000;
        if (s < SIGNAL_END) open = ease(clamp01((s - SIGNAL_START) / SIGNAL_RUN)) * (far + 12);
      }
      const BAND = 7;   // cells of dots at the wave front
      for (let k = pulses.length - 1; k >= 0; k--) if (t - pulses[k].t0 > 2200) pulses.splice(k, 1);
      // dot paths, one per colour, filled once at the end
      const paths = new Map();
      const dot = (x, y, r, col) => {
        if (r < .35) return;
        let p = paths.get(col); if (!p) { p = new Path2D(); paths.set(col, p); }
        const cx = (x + .5) * cell, cy = (y + .5) * cell;
        p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2);
      };
      const full = cell * .46;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          // warped, drifting bands
          const wx = x * sc, wy = y * sc * 1.4;
          const warp = noise(wx * .7 + time * .05, wy * .7 - time * .04);
          let v = fbm2(wx + warp * 1.6 + time * .07, wy - warp * 1.2 + time * .03);
          v = v * .9 + .5 * (Math.sin((x * sc + warp * 2.5 + time * .25) * 2.2) * .5 + .5) * .2;
          // the pointer warms the mesh toward the pink end, and opens up the dots
          const dx = x - ptr.x, dy = y - ptr.y, near = ptr.s * Math.exp(-(dx * dx + dy * dy) / (rad * rad));
          v += .35 * near;
          v = Math.min(1, Math.max(0, (v - .18) / .7));
          const [r, g, b] = gmap(v);
          let alpha = 255;
          // halftone patches drifting over the mesh: lighter dots of its own colour
          const h = noise(x * sc * 1.6 - time * .06 + 40, y * sc * 1.6 + time * .05) + near * .6;
          let dr = full * Math.min(1, Math.max(0, (h - .58) / .3));
          let dcol = DOT[Math.min(23, Math.round(Math.min(1, v + .22) * 23))];
          if (EDGE) {
            const band = rows * (TOP ? .4 : .26), from = rows - band;
            const k = TOP ? 1 - y / band : (y - from) / band;   // 0 inside … 1 at the edge
            if (k > 0) {
              // no hard line: the mesh fades out over the first part of the band
              // while dots of its own colour grow in, then the dots shrink to nothing
              alpha = Math.round(255 * Math.pow(clamp01(1 - k / .45), 1.6));
              const wave = 1 + .25 * Math.sin(x * .45 + time * 1.4);
              dr = Math.max(dr, full * clamp01(k / .3) * clamp01((1 - k * wave) / .7));
              dcol = DOT[Math.round(v * 23)];
            }
          }
          if (PLANET) {
            const R = Math.min(rows * .4, cols * .29), cx = cols / 2, cy = rows / 2;
            const px = x + .5 - cx, py = y + .5 - cy, d = Math.hypot(px, py) / R;
            if (d > 1) {
              alpha = 0;
              const k = (d - 1) / .22;   // the rim breaks into shrinking dots
              dr = k < 1 ? full * (1 - k) : 0;
              dcol = DOT[Math.round(v * 23)];
            }
            // the ring: a tilted ellipse, its back half hidden by the planet
            const ca = Math.cos(-.32), sa = Math.sin(-.32);
            const u = px * ca + py * sa, w = -px * sa + py * ca, rx = R * 1.62, ry = R * .36;
            // distance to the ellipse, so the ring keeps one thickness all round
            const q = Math.hypot(u / rx, w / ry), grad = Math.hypot(u / (rx * rx), w / (ry * ry)) / Math.max(q, 1e-6);
            const e = Math.abs(q - 1) / Math.max(grad, 1e-6);
            if (e < 1.3 && (w > 0 || d > 1)) { dr = full * (e < .6 ? 1 : .7); dcol = e < .6 ? '#FFFFFF' : PALETTE[2]; }
          }
          if (open !== Infinity) {
            const d = Math.hypot(x + .5 - ocx, y + .5 - ocy), f = d - open;
            if (f > BAND || open <= 0) {
              // not reached yet: dark, apart from the pulsing transmitter
              alpha = 0;
              const beat = .55 + .45 * Math.sin(s * 6);
              dr = d < 1.6 ? full * (s < SIGNAL_START ? clamp01(s / .4) : 1) * beat : 0;
              dcol = '#FFFFFF';
            } else if (f > 0) {
              // the wave front: dots of the mesh's colour, biggest at the very front
              alpha = 0;
              dr = full * (.35 + .65 * (1 - f / BAND));
              dcol = DOT[Math.min(23, Math.round(Math.min(1, v + .3) * 23))];
            } else {
              // behind the front the mesh is live; two echoes ride through it
              for (const lag of [9, 18]) {
                const e = Math.abs(f + lag);
                if (e < 1.4) { dr = Math.max(dr, full * (1 - e / 1.4) * (lag === 9 ? .9 : .6)); dcol = DOT[Math.min(23, Math.round(Math.min(1, v + .3) * 23))]; }
              }
            }
          }
          // signals sent by a click: a ring of dots travelling out from the point
          for (const p of pulses) {
            const age = (t - p.t0) / 1000, rr = age * 34, e = Math.abs(Math.hypot(x - p.x, y - p.y) - rr);
            if (e < 1.5) {
              const fade = 1 - age / 2.2;
              const r2 = full * (1 - e / 1.5) * fade;
              if (r2 > dr) { dr = r2; dcol = DOT[Math.min(23, Math.round(Math.min(1, v + .35) * 23))]; }
            }
          }
          buf[i] = (alpha << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
          dot(x, y, dr, dcol);
        }
      }
      mctx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(mesh, 0, 0, W, H);
      paths.forEach((p, col) => { ctx.fillStyle = col; ctx.fill(p); });
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
    host.addEventListener('pointerdown', (e) => {
      if (still) return;
      const r = canvas.getBoundingClientRect();
      pulses.push({ x: (e.clientX - r.left) / r.width * cols, y: (e.clientY - r.top) / r.height * rows, t0: performance.now() });
      start();
    });
  }

  document.querySelectorAll('canvas.gen-field').forEach(field);
})();

// ---------- halftone edge ----------
// A band of ink dots over the section above: tiny at the top, growing until
// they merge into the solid ink of the footer below. A slow wave runs through
// the dot sizes, so the edge stays alive.
(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('canvas.px-edge').forEach(cv => {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, step = 14, raf = null, visible = false, last = 0;
    const INK = '#0B0B0F';
    const paint = (t) => {
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step);
      const p = new Path2D();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        // depth: 0 at the top, 1 at the bottom; eased so the top stays sparse
        const d = (y + .5) / rows;
        const wave = .12 * Math.sin(x * .35 + y * .5 - t * 1.6);
        const k = Math.min(1, Math.max(0, Math.pow(d, 1.25) + wave * d));
        // past ~0.72 of a step the dots touch, which reads as solid ink
        const r = k * step * .74;
        if (r < .6) continue;
        const cx = x * step + (y % 2 ? step / 2 : 0), cy = (y + .5) * step;
        p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = INK; ctx.fill(p);
      ctx.fillRect(0, H - step, W, step + 2);   // a full row of solid ink, so it joins the footer with no seam
    };
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = GEN_DPR;
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      step = Math.max(10, Math.round(r.width / 90)) * dpr;
      paint(performance.now() / 1000);
    };
    const loop = (t) => {
      raf = null;
      if (!visible || document.hidden) return;
      if (t - last > (GEN_LITE ? 120 : 60)) { last = t; paint(t / 1000); }
      raf = requestAnimationFrame(loop);
    };
    size();
    new ResizeObserver(size).observe(cv);
    if (still) return;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && raf === null) raf = requestAnimationFrame(loop); }).observe(cv);
  });
})();

// ---------- service pieces ----------
// One small generative piece per service, in the hero's pixel palette:
//   brand  – a mark that keeps reshaping (circle → square → diamond → star)
//   social – a feed of posts drifting up, lighting one after another
//   web    – a browser window that builds a page block by block, then a
//            pixel cursor goes to its button and clicks
// and pieces for the about page: odd, orbit, link, plan, rocket
// Drawn at one pixel per cell and scaled up; they animate only on screen.
(() => {
  const C = { k: '#0B0B0F', b: '#3B43FE', l: '#F28AD9', w: '#FFFFFF', g: '#1B1C3A' };
  const CELL = 7, FPS = GEN_LITE ? 8 : 15;
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
    },

    // ---- about page: space pieces for the studio's values ----
    // orbit: a planet with a satellite on a tilted path, passing behind it
    orbit(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, m = Math.min(W, H);
      const R = m * .27, rx = m * .5, ry = m * .19, tilt = -.38;
      const ca = Math.cos(tilt), sa = Math.sin(tilt);
      const a = t * 1.1, sx = cx + (Math.cos(a) * rx) * ca - (Math.sin(a) * ry) * sa, sy = cy + (Math.cos(a) * rx) * sa + (Math.sin(a) * ry) * ca;
      const satFront = Math.sin(a) > 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x + .5 - cx, dy = y + .5 - cy;
        const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
        const e = Math.sqrt((u / rx) ** 2 + (v / ry) ** 2);
        const onOrbit = Math.abs(e - 1) * rx < .9 && dith(x, y, .55);
        const d = Math.hypot(dx, dy);
        let col = null;
        if (onOrbit && v < 0) col = C.l;                                  // back half
        if (d < R - 1.2) col = (dx + dy < -R * .3) ? C.l : (dith(x, y, .45) ? C.b : C.l);
        else if (d < R) col = C.k;
        if (onOrbit && v >= 0) col = C.b;                                 // front half
        if (Math.abs(x + .5 - sx) < 1.6 && Math.abs(y + .5 - sy) < 1.6 && (satFront || d > R)) col = C.k;
        if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
      }
    },
    // odd one out: a grid of identical dots, one of them grows, turns blue and
    // drifts out of line
    odd(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const step = Math.max(4, Math.round(Math.min(W, H) / 9));
      const nx = Math.floor(W / step), ny = Math.floor(H / step);
      const ox = Math.round((W - (nx - 1) * step) / 2), oy = Math.round((H - (ny - 1) * step) / 2);
      const ix = Math.floor(nx / 2), iy = Math.floor(ny / 2);
      const p = (Math.sin(t * 1.3) + 1) / 2;                          // 0 in line … 1 out
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        if (i === ix && j === iy) continue;
        ctx.fillStyle = C.l; ctx.fillRect(ox + i * step, oy + j * step, 1, 1);
      }
      const r = 1 + p * step * .55;
      const cx = ox + ix * step + 1 + p * step * .5, cy = oy + iy * step + 1 - p * step * .7;
      for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
        const d = Math.hypot(x + .5 - cx, y + .5 - cy);
        if (d < r - 1) { ctx.fillStyle = dith(x, y, .55) ? C.b : C.l; ctx.fillRect(x, y, 1, 1); }
        else if (d < r + .2) { ctx.fillStyle = C.k; ctx.fillRect(x, y, 1, 1); }
      }
    },
    // link: two planets with a direct line between them, a packet running across
    link(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const cy = H / 2, m = Math.min(W, H), R = m * .17;
      const ax = W / 2 - m * .32, bx = W / 2 + m * .32;
      const p = (Math.sin(t * 1.4) + 1) / 2, px = ax + R + p * (bx - ax - 2 * R);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const u = x + .5, v = y + .5;
        const da = Math.hypot(u - ax, v - cy), db = Math.hypot(u - bx, v - cy);
        let col = null;
        if (Math.abs(v - cy) < .9 && u > ax + R && u < bx - R && ((x + Math.floor(t * 6)) % 3) < 2) col = C.l;
        if (da < R - 1.2) col = dith(x, y, .3) ? C.b : C.l;
        else if (da < R) col = C.k;
        if (db < R - 1.2) col = dith(x, y, .7) ? C.b : C.l;
        else if (db < R) col = C.k;
        if (Math.abs(u - px) < 1.6 && Math.abs(v - cy) < 1.6) col = C.k;
        if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
      }
    },
    // constellation: stars light up one by one, then lines join them into a shape
    plan(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const m = Math.min(W, H), cx = W / 2, cy = H / 2;
      const P = [[-.4, .28], [-.18, -.3], [.06, .05], [.3, -.36], [.42, .22], [.02, .4]]
        .map(([x, y]) => [Math.round(cx + x * m), Math.round(cy + y * m)]);
      const s = (t % 7) / 7 * 7;                     // 0..7 seconds, then again
      const shown = Math.min(P.length, Math.floor(s / .35) + 1);
      const lines = Math.max(0, Math.min(P.length - 1, (s - 2.4) / .45));
      const put = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
      // lines first, so the stars sit on top
      for (let i = 0; i < Math.floor(lines + 1) && i < P.length - 1; i++) {
        const [x0, y0] = P[i], [x1, y1] = P[i + 1];
        const f = Math.min(1, lines - i), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n * f; k++) {
          const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
          put(x, y, C.b);
        }
      }
      P.slice(0, shown).forEach(([x, y], i) => {
        const big = i === shown - 1 && s < 2.4 ? (Math.floor(t * 8) % 2) : 1;
        put(x, y, C.k);
        if (big) { put(x - 1, y, C.l); put(x + 1, y, C.l); put(x, y - 1, C.l); put(x, y + 1, C.l); put(x - 2, y, C.l); put(x + 2, y, C.l); put(x, y - 2, C.l); put(x, y + 2, C.l); }
      });
    },
    // rocket: a small pixel rocket holding steady, flame flickering, stars rushing past
    rocket(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const S = [
        '....k....', '...klk...', '..klllk..', '..klllk..', '.klbbblk.', '.klbwblk.', '.klbbblk.',
        '.klllllk.', '.klllllk.', 'kklllllkk', 'kbklllkbk', 'kbkkkkkbk', 'kk.....kk'
      ];
      const sc = Math.max(1, Math.round(Math.min(W * .9, H) / 20));
      const sw = S[0].length * sc, sh = S.length * sc;
      const ox = Math.round((W - sw) / 2), oy = Math.round((H - sh - sc * 4) / 2 + Math.sin(t * 2.2) * sc * .6);
      const colOf = { k: C.k, l: C.l, b: C.b, w: C.w };
      // stars streaking down past the rocket
      for (let i = 0; i < 9; i++) {
        const x = Math.floor((hashA(i) * W)), len = 2 + Math.floor(hashA(i + 9) * 4);
        if (x > ox - 2 && x < ox + sw + 2) continue;
        const y = Math.floor((t * (10 + hashA(i + 3) * 14) + hashA(i + 5) * H) % (H + len)) - len;
        ctx.fillStyle = i % 3 ? C.l : C.b; ctx.fillRect(x, y, 1, len);
      }
      S.forEach((row, ry) => [...row].forEach((ch, rx) => {
        if (ch === '.') return;
        ctx.fillStyle = colOf[ch]; ctx.fillRect(ox + rx * sc, oy + ry * sc, sc, sc);
      }));
      // the flame: three columns, their length flickering
      const f = Math.floor(t * 12);
      [3, 4, 5].forEach((c, i) => {
        const len = (i === 1 ? 4 : 2) + ((f + i * 3) % 3);
        for (let k = 0; k < len; k++) {
          ctx.fillStyle = k < 3 ? C.l : C.b;   // no white: it would vanish on the page
          ctx.fillRect(ox + c * sc, oy + sh + k * sc - sc, sc, sc);
        }
      });
    }
  };
  // a fixed 0..1 value per index, for star positions that never jump
  function hashA(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  document.querySelectorAll('canvas.svc-art').forEach(cv => {
    const draw = ART[cv.dataset.art];
    if (!draw) return;
    // each piece is drawn at one cell per pixel into a small canvas, then every
    // filled cell is put on the visible canvas as a round dot: a dot matrix
    const ctx = cv.getContext('2d');
    const lo = document.createElement('canvas'), lctx = lo.getContext('2d', { willReadFrequently: true });
    let W = 0, H = 0, cell = CELL, visible = false, raf = null, last = 0;
    const t0 = performance.now();
    const render = (t) => {
      draw(lctx, W, H, t);
      const d = lctx.getImageData(0, 0, W, H).data, paths = new Map(), r = cell * .44;
      for (let i = 0; i < W * H; i++) {
        if (d[i * 4 + 3] < 128) continue;
        const col = `rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]})`;
        let p = paths.get(col); if (!p) { p = new Path2D(); paths.set(col, p); }
        const cx = (i % W + .5) * cell, cy = (((i / W) | 0) + .5) * cell;
        p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2);
      }
      ctx.clearRect(0, 0, cv.width, cv.height);
      paths.forEach((p, col) => { ctx.fillStyle = col; ctx.fill(p); });
    };
    const size = () => {
      const rect = cv.getBoundingClientRect(), dpr = GEN_DPR;
      W = lo.width = Math.max(1, Math.ceil(rect.width / CELL));
      H = lo.height = Math.max(1, Math.ceil(rect.height / CELL));
      cv.width = Math.round(rect.width * dpr); cv.height = Math.round(rect.height * dpr);
      cell = cv.width / W;
      render(still ? 1.3 : (performance.now() - t0) / 1000);
    };
    const loop = (t) => {
      raf = null;
      if (!visible || document.hidden) return;
      if (t - last >= 1000 / FPS) { last = t; render((t - t0) / 1000); }
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

// ---------- launch line ----------
// The process timeline as a launch: a dot-matrix rocket flies along it as the
// section scrolls through the screen, its exhaust trail becomes the line,
// and each step's node lights up once the rocket has passed it.
(() => {
  const cv = document.querySelector('canvas.pr-launch');
  if (!cv) return;
  const track = cv.parentElement, steps = [...track.querySelectorAll('.pr-step')];
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d');
  const CELL = 5;
  const C = { k: '#0B0B0F', w: '#FFFFFF', p: '#F28AD9' };
  // pointing right; the nose is the last column
  const ROCKET = [
    'kk..........',
    'kwk..kkkk...',
    '.kwkkwwwwkk.',
    '.kwwwwwppwwk',
    '.kwkkwwwwkk.',
    'kwk..kkkk...',
    'kk..........'
  ];
  const RW = ROCKET[0].length, RH = ROCKET.length;
  // W and H are in cells; the canvas itself is full resolution and every cell
  // is drawn as a round dot
  let W = 0, H = 0, px = CELL, nodes = [], cur = still ? 1 : 0, target = cur, raf = null, visible = false, lastIdle = 0;
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

  const size = () => {
    const r = cv.getBoundingClientRect(), dpr = GEN_DPR;
    W = Math.max(1, Math.ceil(r.width / CELL));
    H = Math.max(1, Math.ceil(r.height / CELL));
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    px = cv.width / W;
    // each node's position along the line, in cells (the node is 16px wide)
    nodes = steps.map(s => (s.getBoundingClientRect().left - r.left + 8) / CELL);
    draw(performance.now());
  };

  // 0 when the list's top reaches the lower part of the screen, 1 a little
  // after it has passed the middle
  const progress = () => {
    const r = track.getBoundingClientRect(), vh = innerHeight;
    return Math.min(1, Math.max(0, (vh * .9 - r.top) / (vh * .55)));
  };

  function draw(t) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const cy = Math.floor(H / 2), f = Math.floor(t / 70);
    // the rocket's tail position: from just before the first node to the far end
    const end = W - RW, x = Math.round(-RW + cur * (end + RW));
    const moving = Math.abs(target - cur) > .002;
    const put = (x, y, c) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc((x + .5) * px, (y + .5) * px, px * .44, 0, Math.PI * 2); ctx.fill();
    };
    // the path still ahead: a faint dotted line
    for (let i = Math.max(0, x + RW); i < W; i += 3) put(i, cy, 'rgba(255,255,255,.35)');
    // the trail behind: a solid line, with exhaust puffing out near the rocket
    for (let i = 0; i < x; i++) {
      put(i, cy, C.w);
      const d = x - i;                                   // distance behind the rocket
      if (d < 26) {
        const spread = Math.round(1 + d / 6);
        for (let s = -spread; s <= spread; s++) {
          if (s === 0) continue;
          if (hash(i * 3 + f, s + f * 7) < (moving ? .55 : .25) * (1 - d / 26)) put(i, cy + s, d < 8 ? C.w : C.p);
        }
      }
    }
    // the flame, flickering, longer while it moves
    const fl = (moving ? 4 : 2) + (f % 3);
    for (let k = 1; k <= fl; k++) put(x - k, cy, k < 2 ? C.w : C.p);
    if (moving) { put(x - 1, cy - 1, C.p); put(x - 1, cy + 1, C.p); }
    // the rocket, with a slight bob
    const oy = cy - (RH >> 1) + (moving ? 0 : Math.round(Math.sin(t / 400) * .6));
    ROCKET.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch !== '.') put(x + rx, oy + ry, C[ch]); }));
    // light the nodes the rocket has passed
    steps.forEach((s, i) => s.classList.toggle('is-on', x + RW >= nodes[i]));
  }

  function loop(t) {
    raf = null;
    if (!visible) return;
    target = progress();
    const before = cur;
    cur += (target - cur) * .08;
    // at rest, a redraw a few times a second is enough for the flame and bob
    if (Math.abs(cur - before) > .0005 || t - lastIdle > 150) { lastIdle = t; draw(t); }
    raf = requestAnimationFrame(loop);
  }

  track.classList.add('has-launch');
  size();
  new ResizeObserver(size).observe(cv);
  if (still) return;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && raf === null) raf = requestAnimationFrame(loop);
  }).observe(track);
})();
