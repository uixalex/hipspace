// ---------- shared across every page ----------
// Loaded before the per-page script (script.js on home, case-study.js on a case
// study), so anything declared here is available to it.

// Work rows link straight to `site` (the live project) for now. `src` is the
// hover peek image — a project without one simply shows no peek card, so adding
// the file later is enough to bring it back.
// `hero`, `gallery` and `body` feed case-study.html, which is finished but not
// linked from the site yet: those get filled in per project as case studies are written.
const PROJECTS = [
  { n: "01", name: "MOKE",          meta: "Web Design",           src: "assets/p-moke.webp",        site: "https://mokeinternational.com/",  gallery: [], body: "An electric-vehicle brand with a beach-club soul, brought to life through a playful and immersive website." },
  { n: "02", name: "Moving Portal", meta: "Web Design",           src: "assets/moving-portal.webp", site: "https://themovingportal.co.uk/",  gallery: [], body: "" },
  { n: "03", name: "Bytek",         meta: "Branding & Web Design", src: "assets/bytek.webp",         site: "https://bytek.ba/",               gallery: [], body: "" },
  { n: "04", name: "Rello",         meta: "Web Design",           src: "assets/rello.webp",         site: "https://rello.co.uk/",            gallery: [], body: "" },
  { n: "05", name: "SHe2",          meta: "Branding & Web Design", src: "assets/p-wonderwomen.webp", site: "https://she2leadership.com/wp-content/uploads/2023/07/SHe2-Leadership-Brief-Overview.pdf", gallery: [], body: "A community platform for women in business, built around bold editorial type, generous space and a confident digital presence." },
  { n: "06", name: "Quackables",    meta: "Web Design",           src: "assets/quackables.webp",    site: "https://quackables.vercel.app/",  gallery: [], body: "" },
  { n: "07", name: "Teatar Dankan", meta: "Branding & Web Design", src: "assets/teatar-dankan.webp", site: "https://dankanbanjaluka.com/",    gallery: [], body: "" }
];

// ---------- canvas spray helpers ----------
// Shared by the site-wide rocket cursor and the hero saucer trail in script.js.
function resizeCanvas(canvas, ctx) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, r.width * dpr);
  canvas.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function emit(store, p, last, t, spread, alpha, ink) {
  const moved = last ? Math.hypot(p.x - last.x, p.y - last.y) : 0;
  if (moved < 0.7) return;
  const steps = Math.max(1, Math.min(14, Math.round(moved / 4)));
  for (let i = 0; i < steps; i++) {
    const k = last ? i / steps : 1;
    const x = last ? last.x + (p.x - last.x) * k : p.x;
    const y = last ? last.y + (p.y - last.y) * k : p.y;
    for (let j = 0; j < 2; j++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * spread;
      store.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.8, r: 4 + Math.random() * 16, a: alpha * (0.5 + Math.random() * 0.5), born: t, ink });
    }
  }
}

function paint(ctx, canvas, puffs, t, LIFE, FADE) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  for (const q of puffs) {
    const age = t - q.born;
    if (age > LIFE) continue;
    const fade = age > LIFE - FADE ? 1 - (age - (LIFE - FADE)) / FADE : 1;
    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
    g.addColorStop(0, `rgba(${q.ink},${q.a * fade})`);
    g.addColorStop(1, `rgba(${q.ink},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- work rows ----------
// Shared by the home work list and the “more work” list on a case study.
function buildWorkRows(container, projects) {
  projects.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'work-row';
    // no image yet means no peek: the row still works, and dropping the file in
    // later is all it takes to bring the saucer and card back
    const peek = p.src ? `
        <div class="work-peek">
          <div class="work-peek-saucer-wrap">
            <img class="work-peek-saucer" src="assets/saucer-blue.png" alt="" style="animation-delay:${i * 0.3}s" />
          </div>
          <div class="work-peek-beam"></div>
          <div class="work-peek-card" style="animation-delay:${i * 0.4}s">
            <div class="work-peek-img" style="background-image:url('${p.src}')"></div>
          </div>
        </div>` : '';
    row.innerHTML = `
      <a class="work-row-inner" href="${p.site}" target="_blank" rel="noopener noreferrer">
        <span class="work-n">${p.n}</span>
        <h3 class="work-name">${p.name}</h3>
        <span class="work-end">
          <span class="work-meta">${p.meta}</span>
          <span class="work-arrow" aria-hidden="true">↗</span>
        </span>
${peek}
      </a>
    `;
    attachPeekParallax(row);
    container.appendChild(row);
  });
}

// ---------- work peek parallax ----------
const PEEK_X = 14, PEEK_Y = 8, PEEK_EASE = 0.12;
let peekRow = null, peekSettleRow = null, peekRaf = null;
const peekTarget = { x: 0, y: 0 };
const peekCur = { x: 0, y: 0 };

function peekLoop() {
  peekCur.x += (peekTarget.x - peekCur.x) * PEEK_EASE;
  peekCur.y += (peekTarget.y - peekCur.y) * PEEK_EASE;
  const settled = Math.abs(peekTarget.x - peekCur.x) < 0.1 && Math.abs(peekTarget.y - peekCur.y) < 0.1;
  if (peekRow) {
    peekRow.style.setProperty('--px', peekCur.x.toFixed(2) + 'px');
    peekRow.style.setProperty('--py', peekCur.y.toFixed(2) + 'px');
    peekRaf = requestAnimationFrame(peekLoop);
    return;
  }
  // no active row: keep easing the last one back to rest, then clean up
  if (peekSettleRow) {
    if (settled) {
      peekSettleRow.style.removeProperty('--px');
      peekSettleRow.style.removeProperty('--py');
      peekSettleRow = null;
    } else {
      peekSettleRow.style.setProperty('--px', peekCur.x.toFixed(2) + 'px');
      peekSettleRow.style.setProperty('--py', peekCur.y.toFixed(2) + 'px');
    }
  }
  peekRaf = peekSettleRow ? requestAnimationFrame(peekLoop) : null;
}

function startPeekLoop() { if (peekRaf === null) peekRaf = requestAnimationFrame(peekLoop); }

function attachPeekParallax(row) {
  row.addEventListener('mouseenter', () => {
    if (peekSettleRow && peekSettleRow !== row) {
      peekSettleRow.style.removeProperty('--px');
      peekSettleRow.style.removeProperty('--py');
    }
    peekSettleRow = null;
    peekRow = row;
    peekCur.x = 0; peekCur.y = 0;
    peekTarget.x = 0; peekTarget.y = 0;
    startPeekLoop();
  });
  row.addEventListener('mousemove', (e) => {
    if (peekRow !== row) return;
    const r = row.getBoundingClientRect();
    peekTarget.x = ((e.clientX - r.left) / r.width * 2 - 1) * PEEK_X;
    peekTarget.y = ((e.clientY - r.top) / r.height * 2 - 1) * PEEK_Y;
    startPeekLoop();
  }, { passive: true });
  row.addEventListener('mouseleave', () => {
    if (peekRow !== row) return;
    peekRow = null;
    peekSettleRow = row;
    peekTarget.x = 0; peekTarget.y = 0;
    startPeekLoop();
  });
}

// ---------- footer ----------
// One source of truth: every page carries an empty #site-footer and gets the
// markup from here, so a new page never has to copy it.
function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  mount.innerHTML = `
    <footer id="contact" data-ink="pink">
      <div class="footer-inner">
        <div class="footer-links reveal">
          <a href="mailto:hello@hipspace.studio">hello@hipspace.studio</a>
          <a href="https://instagram.com">instagram</a>
          <a href="https://linkedin.com">linkedin</a>
        </div>

        <div class="footer-logo">
          <img class="letter" style="left:0%;top:0%;width:43.16%" src="assets/L-h.png" alt="h" />
          <img class="letter" style="left:48.84%;top:9.97%;width:13.68%" src="assets/L-i.png" alt="i" />
          <img class="letter" style="left:68.21%;top:28.21%;width:28.63%" src="assets/L-p.png" alt="p" />
          <img class="letter" style="left:49.05%;top:81.77%;width:9.05%" src="assets/L-s.png" alt="s" />
          <img class="letter" style="left:58.53%;top:81.77%;width:10.74%" src="assets/L-pk.png" alt="p" />
          <img class="letter" style="left:69.47%;top:81.77%;width:10.53%" src="assets/L-a.png" alt="a" />
          <img class="letter" style="left:80.42%;top:81.48%;width:9.68%" src="assets/L-c.png" alt="c" />
          <img class="letter" style="left:90.32%;top:81.48%;width:9.68%" src="assets/L-e.png" alt="e" />
        </div>

        <div class="footer-bottom">
          <span>&copy; 2026 hipspacestudio</span>
          <a href="mailto:hello@hipspace.studio">let's launch your brand</a>
        </div>
      </div>
    </footer>
  `;
}
renderFooter();

// ---------- mobile nav ----------
// Built from the nav that is already on the page, so each page keeps its own
// hrefs (the case study points back at index.html) with no duplicated markup.
function renderMobileNav() {
  const navInner = document.querySelector('.nav-inner');
  if (!navInner || document.querySelector('.mnav')) return;

  const links = [...document.querySelectorAll('.nav-links a')]
    .map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
  if (!links.length) return;

  const launch = document.querySelector('.nav-right a[href="#contact"]');
  const logo = document.querySelector('.logo');
  const logoHref = logo ? logo.getAttribute('href') : 'index.html';

  const burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span><span></span><span></span>';
  navInner.appendChild(burger);

  const mnav = document.createElement('div');
  mnav.className = 'mnav';
  mnav.hidden = false;
  mnav.innerHTML = `
    <div class="mnav-bar">
      <a href="${logoHref}" class="logo"><img src="assets/logo.png" alt="hip space" /></a>
      <button class="mnav-close" type="button" aria-label="Close menu"><span></span><span></span></button>
    </div>
    <nav class="mnav-links">
      ${links.map((l, i) => `<a href="${l.href}" style="--d:${i * 70}ms"><span class="n">${String(i + 1).padStart(2, '0')}</span>${l.text}</a>`).join('')}
    </nav>
    <div class="mnav-foot">${launch ? `<a class="cta-pill" href="${launch.getAttribute('href')}">${launch.textContent.trim()}</a>` : ''}</div>
  `;
  document.body.appendChild(mnav);

  const setOpen = (open) => {
    mnav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setOpen(true));
  mnav.querySelector('.mnav-close').addEventListener('click', () => setOpen(false));
  // any link closes it: same-page anchors would otherwise scroll behind the overlay
  mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}
renderMobileNav();

// ---------- scroll reveal ----------
// After renderFooter(): .footer-links carries .reveal and must be observed too.
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal, .reveal-lines').forEach(el => io.observe(el));

// stagger the children of .reveal-lines so headings arrive line by line
document.querySelectorAll('.reveal-lines').forEach(el => {
  Array.from(el.children).forEach((child, i) => child.style.setProperty('--d', (i * 90) + 'ms'));
});

// fallback: only for what is already on screen at load — anything below the fold
// must stay hidden until it is actually scrolled to
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.in-view)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in-view');
  });
}, 1200);

// ---------- site-wide rocket cursor spray ----------
const cursorCanvas = document.getElementById('cursor-canvas');
const cursorCtx = cursorCanvas.getContext('2d');
resizeCanvas(cursorCanvas, cursorCtx);
window.addEventListener('resize', () => resizeCanvas(cursorCanvas, cursorCtx));

let cursorPuffs = [];
let lastMouse = null;
let mouse = null;
let currentInk = '254,181,234';

window.addEventListener('mousemove', (e) => {
  mouse = { x: e.clientX, y: e.clientY };
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const zone = el && el.closest ? el.closest('[data-ink]') : null;
  currentInk = zone && zone.dataset.ink === 'blue' ? '31,47,196' : '254,181,234';
}, { passive: true });

function cursorTick(t) {
  requestAnimationFrame(cursorTick);
  if (mouse) {
    const tail = { x: mouse.x + 16, y: mouse.y + 15 };
    emit(cursorPuffs, tail, lastMouse, t, 10, 0.12, currentInk);
    lastMouse = tail;
  }
  if (cursorPuffs.length > 500) cursorPuffs.splice(0, cursorPuffs.length - 500);
  paint(cursorCtx, cursorCanvas, cursorPuffs, t, 620, 520);
  cursorPuffs = cursorPuffs.filter(q => t - q.born <= 620);
}
requestAnimationFrame(cursorTick);
